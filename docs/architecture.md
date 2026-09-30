# Architecture

## Solution Overview
SOS ProcureSphere 360 is designed as a modular, cloud-ready platform with three tightly linked domains:

1. Procurement Management System
2. Document Management System
3. Financial workflow and banking integration

## Runtime Architecture
- Frontend: React + TypeScript + Vite + Tailwind + TanStack Query
- API: TypeScript + Express modular REST services
- Data model: PostgreSQL-ready Prisma schema in [schema.prisma](../apps/api/prisma/schema.prisma)
- Object storage: local upload storage for demo, S3-compatible abstraction targeted for production
- Queue/cache target: Redis
- Banking integration: pluggable adapter layer with working mock adapter
- Search: metadata + OCR text search on document records
- PWA: installable browser experience for approvals on mobile

## Domain Modules
- Auth and RBAC: role-switchable demo access, extensible for OIDC/SAML integration
- Suppliers: onboarding, due diligence, performance, blacklist handling
- Procurement: PRs, RFx, bids, evaluations, awards, POs, receiving, invoices, matching
- Finance: budgets, commitment control, payment requests, approvals, adapter handoff, reconciliation
- DMS: upload, metadata, OCR text indexing, retention policy, archive log, audit-pack download
- Audit: immutable event stream and CSV export

## Security Model
- HTTPS/TLS 1.3 in production termination tier
- AES-256 at-rest target for database and object storage
- Secret management through environment variables or cloud secret vault
- SoD checks enforced during approval and receiving routes
- Role-based permissions mapped per user and role set
- Audit logging for creates, approvals, matching, uploads, exports, and escalations

## Production Hardening Roadmap
- Integrate Keycloak, Azure AD, or Auth0 for SSO and MFA
- Replace demo auth with token-based sessions and TOTP enrollment
- Activate Prisma repositories against PostgreSQL
- Move document storage from local disk to S3 or MinIO bucket abstraction
- Add OCR worker queue with BullMQ and Tesseract or managed OCR provider
- Add HSTS, secure cookies, session device control, and admin IP allowlists

## Integration Surface
- `/api/v1/suppliers/*`
- `/api/v1/procurement/*`
- `/api/v1/finance/*`
- `/api/v1/dms/*`
- `/api/v1/audit/*`

OpenAPI docs are served at `/docs` by the API.
