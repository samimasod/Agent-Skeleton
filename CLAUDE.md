# Multi-Tenant Application Skeleton — Guidelines & Claude Code Instructions

Please refer to [AGENTS.md](file:///Users/sami/Desktop/Skeleton/AGENTS.md) and [GEMINI.md](file:///Users/sami/Desktop/Skeleton/GEMINI.md) for full project guidelines, multi-cloud setup, database migration rules, 8-step CRUD module patterns, pagination framework, AI Agent ecosystem details, and UI standards.

## Quick Reference Commands

- **Alembic Revision**: `.venv/bin/python -m alembic -c apps/api/migrations/alembic.ini revision --autogenerate -m "<msg>"`
- **Apply Migration**: `.venv/bin/python -m alembic -c apps/api/migrations/alembic.ini upgrade head`
- **Sync Shared Types**: `pnpm typegen`
- **TypeScript Typecheck**: `pnpm typecheck`
- **Run Pytest Unit Tests**: `.venv/bin/python -m pytest tests/unit/`
- **Production Web Build**: `pnpm build:web`
