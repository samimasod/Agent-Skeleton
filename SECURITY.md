# Security Policy & Guidelines

Security and tenant data boundary isolation are top priorities for this codebase.

---

## Reporting Vulnerabilities

If you discover a security vulnerability or potential tenant isolation bypass, please report it privately:

- **Email**: `security@skeleton.io` or open a private advisory on GitHub.
- **Response SLA**: We acknowledge all reports within 24 hours and aim to provide a security patch release within 72 hours for critical issues.

---

## Security Model Overview

1. **Tenant Scoping**: All tenant models enforce `organization_id` foreign keys with `ondelete="CASCADE"`. Every FastAPI endpoint verifies tenant access using `check_permission()`.
2. **SuperAdmin Separation**: The SuperAdmin API (`apps/api_admin`) runs as an isolated microservice on port 8001 with independent auth verification (`verify_admin_auth`). Tenant user credentials cannot access admin endpoints.
3. **Tool Execution Notice**: Python tools execute in a clean namespace with `run(**kwargs)` scope. For untrusted third-party code in production, deploy inside Docker container/process sandboxes with disabled network access.
