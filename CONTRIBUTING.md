# Contributing to Multi-Tenant Application Skeleton

Thank you for your interest in contributing to the Multi-Tenant Application Skeleton! We welcome community contributions, bug fixes, features, and documentation improvements.

---

## 1. Development Setup

1. **Fork and clone the repository**:
   ```bash
   git clone https://github.com/your-username/Skeleton.git
   cd Skeleton
   ```

2. **Set up local environment**:
   ```bash
   cp .env.example .env
   pnpm install
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Apply database migrations**:
   ```bash
   .venv/bin/python -m alembic -c apps/api/migrations/alembic.ini upgrade head
   ```

---

## 2. Quality Verification Rules

Before submitting a Pull Request, ensure that all quality checks pass cleanly:

1. **Pytest Unit Test Suite**:
   ```bash
   .venv/bin/python -m pytest tests/unit/
   ```

2. **Synchronize TypeScript Types**:
   ```bash
   pnpm typegen
   ```

3. **Workspace Typecheck**:
   ```bash
   pnpm typecheck
   ```

---

## 3. Pull Request Guidelines

- Follow the 8-step backend module pattern outlined in `AGENTS.md` and `docs/developer_guide.md`.
- Enforce tenant isolation (`organization_id` foreign key on domain models).
- Add unit tests for any new endpoints or service business logic.
