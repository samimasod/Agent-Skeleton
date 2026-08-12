# Product & Architecture Roadmap

This document outlines the current status and planned roadmap for the Multi-Tenant Application Skeleton.

---

## Current Status & Planned Capabilities

| Category | Capability | Status |
| :--- | :--- | :--- |
| **Multi-Tenancy** | Organization Isolation (`organization_id` FKs) | ✅ Implemented & Tested |
| **RBAC** | Role-based permission checking (`check_permission`) | ✅ Implemented & Tested |
| **AI Subsystem** | Stateful WebSocket streaming (`/chat/ws`) | ✅ Implemented & Tested |
| **AI Subsystem** | TOON Token Optimization (tabular JSON) | ✅ Implemented & Tested |
| **AI Subsystem** | Sandboxed Python tool execution & fallback UI | ✅ Implemented & Tested |
| **SuperAdmin** | Telemetry, cloud monitor pool, & quota management | ✅ Implemented & Tested |
| **Billing** | Stripe subscription & usage-based metering | 📅 Planned |
| **Auth** | Passwordless magic link & SSO | 📅 Planned |
| **Infra** | Terraform AWS & GCP IaC templates | 📅 Planned |
| **Mobile** | React Native Expo full feature parity | 🟡 Partial |
