# Multi-Tenant Application Skeleton — Guidelines & Agent Instructions

This repository is a production-grade, multi-tenant application skeleton designed for rapidly building high-performance, multi-user SaaS platforms and AI-powered products. It features multi-cloud infrastructure support (Google Cloud Platform, Amazon Web Services, and Local deployments), seamless database provider connectivity, multi-backend object storage, robust organization-based RBAC, real-time AI Agent orchestration, and cross-platform Web and Mobile clients.

All AI coding agents and developers working on this codebase MUST review and strictly adhere to the guidelines, architectural patterns, and directives detailed below.

For complete developer tutorials, refer to [docs/developer_guide.md](file:///Users/sami/Desktop/Skeleton/docs/developer_guide.md) and [docs/agent_creation_guide.md](file:///Users/sami/Desktop/Skeleton/docs/agent_creation_guide.md).

---

## 🏗️ 1. Core Architecture & Multi-Cloud Setup

### Tenant Isolation & RBAC
- **Multi-Tenant Isolation**: Every tenant-owned domain model MUST enforce isolation via an `organization_id` foreign key referencing `organizations.id` with `index=True` and `ondelete="CASCADE"`.
- **Permission Checking**: Every backend endpoint MUST check user roles and enforce organization boundaries using `check_permission(role, Permission...)`.

### Environment & Cloud Provider Agnostic Setup (`apps/api/config.py`)
The application seamlessly connects across **Google Cloud Platform (GCP)**, **Amazon Web Services (AWS)**, and **Local / Self-Hosted** environments via environment variables:
- **Database (`DATABASE_URL` / `DATABASE_ENV`)**: Async PostgreSQL (via `asyncpg` and SQLAlchemy 2.0). Connects seamlessly to GCP Cloud SQL, AWS RDS/Aurora, Supabase, Neon, or local PostgreSQL/SQLite.
- **Object Storage (`STORAGE_PROVIDER`)**: Supports `local` (disk storage), `gcs` (Google Cloud Storage via `GCS_BUCKET_NAME`), and `s3` (AWS S3 via `S3_BUCKET_NAME`).
- **Caching (`CACHE_BACKEND`)**: Multi-backend cache abstraction supporting `redis` (`REDIS_URL`) or in-memory caching.
- **Authentication**: Firebase Authentication (ID token verification & role resolution) + Organization RBAC (`Owner`, `Admin`, `Member`, `Viewer`, `Super Admin`).

---

## 🗄️ 2. Database Migrations (Alembic Directives)

- **NEVER** modify existing database table schemas without generating and applying an Alembic migration.
- **Step 1**: Register all new models in `apps/api/migrations/env.py`.
- **Step 2**: Generate DDL migration revision:
  ```bash
  .venv/bin/python -m alembic -c apps/api/migrations/alembic.ini revision --autogenerate -m "<description>"
  ```
- **Step 3**: Apply migration to the database:
  ```bash
  .venv/bin/python -m alembic -c apps/api/migrations/alembic.ini upgrade head
  ```

---

## 🛠️ 3. Backend CRUD Architecture (9-Step Module Pattern)

When creating or extending domain modules under `apps/api/modules/<module_name>/`, follow this standard 9-step structure:

```text
apps/api/modules/<module_name>/
├── __init__.py
├── models.py      # Step 1: SQLAlchemy 2.0 ORM model with organization_id FK
├── schemas.py     # Step 3: Pydantic V2 schemas (CreateInput, UpdateInput, Response, ListResponse)
├── repository.py  # Step 4: Data access layer (AsyncSession SQL queries with pagination)
├── service.py     # Step 5: Business logic, permission checks, NotFoundError
└── router.py      # Step 6: FastAPI router with PaginationParams & response builder
```
- **Step 1**: Implement database model in `models.py` with indexed `organization_id` foreign key.
- **Step 2**: Register model in `apps/api/migrations/env.py` and run Alembic database migration.
- **Step 3**: Define Pydantic V2 validation schemas in `schemas.py`.
- **Step 4**: Implement data repository queries in `repository.py`.
- **Step 5**: Implement business logic & permission checks in `service.py`.
- **Step 6**: Create FastAPI router in `router.py` with `PaginationParams`.
- **Step 7**: Register router in `apps/api/main.py` (`app.include_router(...)`).
- **Step 8**: Synchronize TypeScript types via `pnpm typegen`.
- **Step 9**: **Mandatory Integration & E2E Testing**:
  - Add backend integration tests under `tests/integration/test_<module_name>_integration.py` covering CRUD operations, tenant boundary isolation (Org 1 vs Org 2), and RBAC permissions.
  - Add Playwright E2E browser tests under `apps/web/e2e/<feature_name>.spec.ts` using `setupAuthenticatedUser` helper to verify full-stack UI -> API -> DB execution.

---

## 📑 4. Centralized Pagination Framework

- **Mandatory Usage**: All collection endpoints (e.g. Products, Orders, Job Listings, Users, Agents) MUST use the centralized pagination module. Singletons or 1-to-1 models (e.g. Master Resume, User Profile, Settings) omit pagination.
- **Backend (FastAPI)**:
  ```python
  from apps.api.core.pagination import PaginationParams, build_paginated_response

  @router.get("", response_model=MyListResponse)
  async def list_items(
      organization_id: int,
      pagination: PaginationParams = Depends(),
      service: MyService = Depends(),
  ):
      items, total = await service.get_paginated(organization_id, page=pagination.page, page_size=pagination.page_size)
      return MyListResponse(
          items=[MyResponse.model_validate(item) for item in items],
          **build_paginated_response(total, pagination),
      )
  ```
- **Web UI (`apps/web`)**: Use `usePagination` hook (`apps/web/src/hooks/use-pagination.ts`).
- **Mobile React Native (`apps/mobile`)**: Use `usePaginatedList` hook (`apps/mobile/hooks/use-paginated-list.ts`) for infinite scroll `FlatList` components.

---

## 🤖 5. AI Agent Subsystem & LLM Integration

The application includes a state-of-the-art AI Agent builder and execution runtime:

### LLM Multi-Provider Support
- Configurable via `LLM_PROVIDER`: `"openrouter"` (accessing Gemini, Claude, Llama, etc.) or `"openai"` (direct OpenAI integration like GPT-4o).
- Model selection and system prompts are customizable per agent profile in the Agent Builder UI (`/dashboard/agents`).

### Real-Time Streaming & WebSocket Chat Protocol
- Stateful WebSocket endpoint: `/api/agents/{agent_id}/chat/ws?token=<firebase_token>&session_id=<uuid>`.
- Event stream emits: `session_created`, `text_delta`, `tool_started`, `tool_completed`, and `message_completed`.

### Tool System & UI Display Modes (`ui_mode`)
- **Sandboxed Python Tools**: Registered in Admin Panel (`/dashboard/admin/tools`) or attached to agent profiles with input schemas and Python `run(**kwargs)` scripts.
- **UI Display Placement (`ui_mode`)**:
  - `inline`: Renders interactive visual components in the main chat body (e.g. widgets).
  - `collapsible`: Keeps background execution logs inside the Chain-of-Thought step.
  - `both`: Displays in both locations.
- **3-Level Automatic Fallback Renderer**: Formats unhandled tool JSON outputs into Key-Value Cards, Data Table Grids, or Monospaced Code Blocks.

### Reusable Web Chat UI (`<AgentChatView />`)
- **Mandatory Web Component**: Whenever embedding an AI agent chat interface in `apps/web` (dashboards, modals, drawers, overlays), **ALWAYS** use the reusable `<AgentChatView agentId={agentId} />` component (`apps/web/src/components/agent-chat-view.tsx`).
- **Included Features**: Handles stateful WebSocket streaming, history pagination, Streamdown Markdown rendering (`<MessageResponse />`), client-side Web Speech API voice transcription (`<SpeechInput />`), Chain-of-Thought tool steps, and inline Human-in-the-Loop tool approval cards automatically. Never re-implement custom WebSocket chat loops on web pages.

### Tool Mutation Approval Gate (`require_approval`)
- **Mutation Safety**: Any tool that performs database mutations (delete, update), financial transactions, notification sends, or external API writes **MUST** have `require_approval=True`.
- **RBAC Exemptions**: Use `approval_required_for_roles=["member", "viewer"]` to gate non-admin users while letting trusted Owners/Admins execute tools without friction.

### Token Optimization
- Use **TOON (Token-Oriented Object Notation)** (`apps/api/modules/agents/toon_utils.py`) to serialize tabular JSON outputs, saving 30%–60% of LLM context tokens.

---

## 💻 6. Type Safety, Verification & Code Quality

- **Shared Types**: After modifying FastAPI Pydantic schemas, ALWAYS run `pnpm typegen` from workspace root to synchronize TypeScript interfaces in `packages/shared-types`.
- **Verification Directives**: ALWAYS run `pnpm typecheck` across all workspace projects (`apps/web`, `apps/mobile`, `packages/shared-types`), run unit tests (`.venv/bin/python -m pytest tests/unit/`), and run integration tests (`.venv/bin/python -m pytest tests/integration/`) to verify **0 build, type, or test errors** before declaring completion.

---

## 🎨 7. UI Best Practices & Design Excellence

- **Web UI (`apps/web`)**:
  - Use React 18, Vite, and Tailwind CSS with curated HSL theme tokens (`bg-sidebar/5`, `border-sidebar-border`, `bg-card`).
  - Use Lucide icons (`lucide-react`) and zero placeholders.
  - Use TanStack Query (`queryClient.invalidateQueries`) for automatic reactive state updates on mutation success. Never force manual full-page browser reloads.
- **Mobile UI (`apps/mobile`)**:
  - Use Expo / React Native with `useTheme()` color tokens.
  - Use `FlatList` with `usePaginatedList`, smooth `LayoutAnimation` toggles, and tactile feedback.

---

## 📋 8. Developer Quick Reference Commands

| Action | Command / Location |
| :--- | :--- |
| **Alembic Revision** | `.venv/bin/python -m alembic -c apps/api/migrations/alembic.ini revision --autogenerate -m "<msg>"` |
| **Apply Migration** | `.venv/bin/python -m alembic -c apps/api/migrations/alembic.ini upgrade head` |
| **Sync Shared Types** | `pnpm typegen` |
| **TypeScript Typecheck** | `pnpm typecheck` |
| **Run Pytest Unit Tests** | `.venv/bin/python -m pytest tests/unit/` |
| **Run Integration Tests** | `.venv/bin/python -m pytest tests/integration/` |
| **Run Playwright E2E Tests** | `pnpm test:e2e` |
| **Run All Test Suites** | `pnpm test:all` |
| **Production Web Build** | `pnpm build:web` |
| **Backend Configuration** | `apps/api/config.py` |
| **Developer Guide** | [docs/developer_guide.md](file:///Users/sami/Desktop/Skeleton/docs/developer_guide.md) |
| **Agent Creation Guide** | [docs/agent_creation_guide.md](file:///Users/sami/Desktop/Skeleton/docs/agent_creation_guide.md) |
