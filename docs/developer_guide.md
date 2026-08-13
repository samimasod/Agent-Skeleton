# Developer Extension Guide

This guide describes how to extend the Multi-Tenant Application Skeleton by adding new CRUD modules, exposing those capabilities to conversational agents, and building state-of-the-art UI components for Web and Mobile applications.

---

## 1. Creating a New Backend CRUD Module

Adding a new domain module (e.g., "Products", "Orders", or "Customers") follows a strict 9-step architecture to maintain multi-tenant isolation, automated type-safety, database migration integrity, and 100% test coverage.

### Directory Structure Convention
Create a new directory under `apps/api/modules/<module_name>`:
```text
apps/api/modules/products/
├── __init__.py
├── models.py      # SQLAlchemy 2.0 ORM models
├── schemas.py     # Pydantic V2 request & response validation schemas
├── repository.py  # Data access layer (AsyncSession SQL queries)
├── service.py     # Business logic layer & permission enforcement
└── router.py      # FastAPI HTTP endpoint routes
```

---

### Step 1: Define the Database Model (`models.py`)
Inherit from `Base` and ensure every tenant-isolated table includes `organization_id` indexed foreign key:
```python
from sqlalchemy import String, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from apps.api.core.database.base import Base

class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    title: Mapped[str] = mapped_column(String(128), nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
```

---

### Step 2: Register Model & Run Alembic Database Migration
1. **Register Model in `env.py`**: Import the model inside `apps/api/migrations/env.py` under `# Import Base and all remaining models`:
   ```python
   from apps.api.modules.products.models import Product
   ```
2. **Generate DDL Migration Revision**:
   ```bash
   .venv/bin/python -m alembic -c apps/api/migrations/alembic.ini revision --autogenerate -m "add_products_table"
   ```
3. **Apply Migration to Database**:
   ```bash
   .venv/bin/python -m alembic -c apps/api/migrations/alembic.ini upgrade head
   ```

---

### Step 3: Define Pydantic Schemas (`schemas.py`)
Define schemas for creation, updates, and list responses with pagination metadata:
```python
from typing import List, Optional
from pydantic import BaseModel, Field

class ProductBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=128)
    price: float = Field(..., ge=0.0)

class ProductCreate(ProductBase):
    organization_id: int

class ProductUpdate(BaseModel):
    title: Optional[str] = None
    price: Optional[float] = None

class ProductResponse(ProductBase):
    id: int
    organization_id: int

    class Config:
        from_attributes = True

class ProductListResponse(BaseModel):
    products: List[ProductResponse]
    total: int
    page: int = 1
    page_size: int = 20
    total_pages: int = 1
    has_more: bool = False
```

---

### Step 4: Repository Layer (`repository.py`)
Implement data access operations with offset/limit pagination:
```python
from typing import List, Optional, Tuple
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from apps.api.modules.products.models import Product

class ProductRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_paginated(self, org_id: int, offset: int = 0, limit: int = 20) -> Tuple[List[Product], int]:
        count_res = await self.session.execute(
            select(func.count(Product.id)).where(Product.organization_id == org_id)
        )
        total = count_res.scalar() or 0

        res = await self.session.execute(
            select(Product)
            .where(Product.organization_id == org_id)
            .order_by(Product.id.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(res.scalars().all()), total
```

---

### Step 5: Service Layer (`service.py`)
Implement business logic and permission handling:
```python
from typing import List, Tuple
from apps.api.core.exceptions.base import NotFoundError
from apps.api.modules.products.models import Product
from apps.api.modules.products.repository import ProductRepository

class ProductService:
    def __init__(self, repository: ProductRepository):
        self.repository = repository

    async def get_paginated_products(self, org_id: int, page: int = 1, page_size: int = 20) -> Tuple[List[Product], int]:
        offset = (page - 1) * page_size
        return await self.repository.get_paginated(org_id, offset=offset, limit=page_size)
```

---

### Step 6: Create HTTP Routes (`router.py`)
Implement FastAPI endpoints using `PaginationParams` dependency and `build_paginated_response` helper:
```python
from fastapi import APIRouter, Depends, status
from apps.api.core.database import get_db
from apps.api.core.pagination import PaginationParams, build_paginated_response
from apps.api.core.security.firebase_auth import FirebaseUser, get_current_user
from apps.api.core.security.permissions import Permission, check_permission
from apps.api.modules.products.schemas import ProductListResponse, ProductResponse

router = APIRouter()

@router.get("", response_model=ProductListResponse)
async def list_products(
    organization_id: int,
    pagination: PaginationParams = Depends(),
    user: FirebaseUser = Depends(get_current_user),
    service: ProductService = Depends(get_product_service),
    org_service: OrganizationService = Depends(get_org_service),
):
    role = await org_service.get_user_role(organization_id, user.uid)
    check_permission(role, Permission.PROJECT_READ)

    products, total = await service.get_paginated_products(
        organization_id, page=pagination.page, page_size=pagination.page_size
    )
    return ProductListResponse(
        products=[ProductResponse.model_validate(p) for p in products],
        **build_paginated_response(total, pagination),
    )
```

---

### Step 7: Register Router in `main.py`
Add the router in `apps/api/main.py`:
```python
from apps.api.modules.products.router import router as products_router
app.include_router(products_router, prefix="/api/products", tags=["Products"])
```

---

### Step 8: Synchronize Shared TypeScript Types
Run `pnpm typegen` from the workspace root:
```bash
pnpm typegen
```
This updates TypeScript interfaces in `packages/shared-types/src/generated/api.ts` used by both Web and Mobile apps.

---

## 2. Exposing CRUD Operations as Agent Tools

Once a CRUD operation is created, you can make it available to agents in one of two ways.

### Approach A: Dynamic Sandbox Tools (Recommended / Zero-Code)
Expose the CRUD module dynamically through the Admin Panel. This is ideal for testing and fast prototyping since it requires no code updates or server redeployment.

1. **Create the Tool**:
   * Navigate to the **Admin Tools Panel** (`/dashboard/admin/tools`).
   * Click **Create Tool**.
2. **Define the JSON Input Schema**:
   Tell the agent what parameters it needs to gather:
   ```json
   {
     "type": "object",
     "properties": {
       "title": { "type": "string", "description": "The title of the product" },
       "price": { "type": "number", "description": "Price in USD" }
     },
     "required": ["title", "price"]
   }
   ```
3. **Write the Sandboxed Python script**:
   Write a script that calls your API endpoints internally:
   ```python
   import httpx

   def run(title: str, price: float):
       headers = {"Content-Type": "application/json"}
       payload = {"title": title, "price": price}
       
       # Hit backend endpoint locally
       response = httpx.post("http://localhost:8000/api/products/", json=payload, headers=headers)
       return response.text
   ```

---

## 3. Best Practices for Frontend & UI Development

Our application emphasizes **exceptional visual quality**, **dynamic state management**, and **responsive multi-platform components**.

### 1. Visual Excellence & Aesthetics
- **Color Palettes**: Use harmonious HSL theme tokens (`bg-sidebar/5`, `border-sidebar-border`, `bg-card`) rather than generic browser colors.
- **Typography & Icons**: Use clean modern fonts (Inter/Outfit) and vector icons from `lucide-react` (Web) or `lucide-react-native` (Mobile).
- **Interactive Micro-Animations**: Use subtle transitions, hover effects, and collapsible containers (`<details>` on Web, `LayoutAnimation` on Mobile).
- **Zero Placeholders**: Never leave plain text placeholders or missing images. Use Generative Tool UI components or generate assets via tools.

### 2. Frontend State Management & Invalidation
- **Web UI (`apps/web`)**:
  - **Agent Chat Interface**: Always use the reusable `<AgentChatView agentId={id} />` component (`@/components/agent-chat-view`) when embedding an agent chat session in dashboards, modals, or sidebars.
  - Always use TanStack Query (`@tanstack/react-query`).
  - Use `useQuery` for reads and `useMutation` for mutations.
  - On mutation success, always call `queryClient.invalidateQueries({ queryKey: [...] })` to trigger reactive background updates automatically.
  - Use `usePagination({ initialPageSize: 10 })` hook from `@/hooks/use-pagination` for table pagination.
- **Mobile UI (`apps/mobile`)**:
  - Use `usePaginatedList<T>(fetcher, pageSize)` from `@/hooks/use-paginated-list` for infinite scroll `FlatList` components.
  - Use `useTheme()` for consistent color tokens across dark/light themes.

---

## 4. Testing Strategy: Integration & Playwright E2E Framework

Our testing framework guarantees that any new module or feature is verified across unit, integration, and full-stack browser levels.

### A. Backend Integration Testing (`tests/integration/`)
Integration tests hit real FastAPI endpoints using an async HTTP client (`httpx.AsyncClient`) connected to an isolated async SQLite test database (`DATABASE_ENV=test`).

1. **Creating an Integration Test**:
   Create a new file `tests/integration/test_<module_name>_integration.py`:
   ```python
   import pytest
   from httpx import AsyncClient

   pytestmark = pytest.mark.asyncio

   async def test_create_product_integration(async_client: AsyncClient, seed_data: dict):
       headers = {"Authorization": "Bearer test-owner-token"}
       payload = {
           "organization_id": seed_data["org1_id"],
           "title": "Enterprise Plan",
           "price": 299.99,
       }

       response = await async_client.post("/api/products", json=payload, headers=headers)
       assert response.status_code == 201
       data = response.json()
       assert data["title"] == "Enterprise Plan"

   async def test_product_tenant_isolation(async_client: AsyncClient, seed_data: dict):
       # Verify Org 1 user cannot access Org 2 products (403 Forbidden)
       headers_org1 = {"Authorization": "Bearer test-owner-token"}
       response = await async_client.get(f"/api/products?organization_id={seed_data['org2_id']}", headers=headers_org1)
       assert response.status_code == 403
   ```
2. **Pre-configured Test Users**:
   - `test-owner-token` -> Role.OWNER in Org 1
   - `test-admin-token` -> Role.ADMIN in Org 1
   - `test-member-token` -> Role.MEMBER in Org 1
   - `test-viewer-token` -> Role.VIEWER in Org 1
   - `test-org2-owner-token` -> Role.OWNER in Org 2

### B. Playwright E2E Browser Testing (`apps/web/e2e/`)
Playwright tests operate standard browser instances to verify end-to-end user journeys (React UI -> FastAPI REST/WS -> Database).

1. **Creating a Playwright E2E Test**:
   Create a new file `apps/web/e2e/<feature_name>.spec.ts`:
   ```typescript
   import { test, expect } from "@playwright/test";
   import { setupAuthenticatedUser } from "./helpers/auth";

   test.describe("Products Feature E2E", () => {
     test.beforeEach(async ({ page }) => {
       await setupAuthenticatedUser(page, { role: "owner" });
       await page.goto("/dashboard/products");
     });

     test("creates a new product via UI and verifies table update", async ({ page }) => {
       await page.click("button:has-text('Create Product')");
       await page.fill("input[name='title']", "Enterprise Plan");
       await page.fill("input[name='price']", "299.99");
       await page.click("button[type='submit']");

       // Verifies reactive UI update powered by TanStack Query + FastAPI + Database
       await expect(page.locator("table")).toContainText("Enterprise Plan");
     });
   });
   ```
2. **Running Playwright Tests**:
   - Headless execution: `pnpm test:e2e`
   - Playwright Interactive UI mode: `npx playwright test --ui`

---

## 5. Summary Quick Reference

| Action | Command / Helper |
| :--- | :--- |
| **Run Unit Tests** | `.venv/bin/python -m pytest tests/unit/` |
| **Run Integration Tests** | `.venv/bin/python -m pytest tests/integration/` |
| **Run Playwright E2E Tests** | `pnpm test:e2e` |
| **Run All Tests** | `pnpm test:all` |
| **Backend Pagination** | `PaginationParams = Depends()`, `build_paginated_response(total, params)` |
| **Web Pagination** | `usePagination({ initialPageSize: 10 })` (`@/hooks/use-pagination`) |
| **Mobile Pagination** | `usePaginatedList<T>(fetcher, pageSize)` (`@/hooks/use-paginated-list`) |
| **Generate Shared Types** | `pnpm typegen` |
| **TypeScript Typecheck** | `pnpm typecheck` |
| **Alembic Migration** | `.venv/bin/python -m alembic -c apps/api/migrations/alembic.ini revision --autogenerate -m "<msg>"` |
