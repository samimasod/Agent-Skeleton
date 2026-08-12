# Local Development & Quickstart Guide

This guide walks you through setting up and running the **Multi-Tenant Application Skeleton** on your local machine.

---

## 1. Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: `v18.0.0` or higher
- **pnpm**: `v8.0.0` or higher (`npm i -g pnpm`)
- **Python**: `v3.11` or higher
- **Virtualenv**: Python virtual environment (`.venv`)

---

## 2. Initial Installation

1. **Clone the repository**:
   ```bash
   git clone <repository_url>
   cd Skeleton
   ```

2. **Install Node.js monorepo dependencies**:
   ```bash
   pnpm install
   ```

3. **Set up Python Virtual Environment**:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

---

## 3. Environment Configuration

Copy the example environment files or create `.env` in the root directory:

```bash
# Main SaaS API Configuration
DATABASE_URL=sqlite+aiosqlite:///./sql_app.db
DATABASE_ENV=local
STORAGE_PROVIDER=local
LOCAL_STORAGE_DIR=./storage
CACHE_BACKEND=memory
REDIS_URL=redis://localhost:6379/0
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=your_openrouter_api_key

# SuperAdmin Microservice Configuration
ADMIN_AUTH_ENABLED=true
SUPER_ADMIN_API_KEY=sk_admin_secret_key_12345
SUPER_ADMIN_EMAILS=["owner@example.com","admin@skeleton.io"]
CORS_ORIGINS=["http://localhost:3001","http://localhost:3002","http://localhost:5173"]
```

---

## 4. Database Setup & Seeding

1. **Run Alembic DDL Database Migrations**:
   ```bash
   .venv/bin/python -m alembic -c apps/api/migrations/alembic.ini upgrade head
   ```

2. **Provision Local Development Users & Organization**:
   ```bash
   pnpm auth:provision
   pnpm auth:seed-org
   ```

---

## 5. Launching Applications

### Option A: Launch All 4 Services Concurrently (Recommended)
Run the provided unified launch script:
```bash
./start.sh
```
This automatically starts:
- **Main SaaS API** (`http://localhost:8000`)
- **SuperAdmin API Microservice** (`http://localhost:8001`)
- **User SaaS Web Dashboard** (`http://localhost:5173`)
- **SuperAdmin Standalone Portal** (`http://localhost:3001` or `3002`)

### Option B: Launch Individual Services
- **Main SaaS API**: `pnpm dev:api` (`http://localhost:8000`)
- **SuperAdmin API**: `pnpm dev:admin-api` (`http://localhost:8001`)
- **User Web App**: `pnpm dev:web` (`http://localhost:5173`)
- **SuperAdmin Web App**: `pnpm dev:admin` (`http://localhost:3001`)
- **Marketing Site**: `pnpm dev:website` (`http://localhost:3000`)

---

## 6. Verification & Test Commands

- **Run Pytest Unit Test Suite**:
  ```bash
  .venv/bin/python -m pytest tests/unit/
  ```
- **Sync Shared TypeScript Interfaces**:
  ```bash
  pnpm typegen
  ```
- **Run Workspace Typecheck**:
  ```bash
  pnpm typecheck
  ```
