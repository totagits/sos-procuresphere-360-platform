# SOS ProcureSphere 360

SOS ProcureSphere 360 is a cloud-ready procure-to-pay, document management, and finance workflow platform for SOS Children's Villages Liberia. This repository includes:

- A responsive React + Vite PWA with a public landing page and role-based operations dashboard
- A modular TypeScript API covering procurement, DMS, finance, audit, and mock banking workflows
- Shared domain contracts and seeded demo data for end-to-end acceptance walkthroughs
- Deployment assets, Docker support, implementation docs, training materials, and support runbooks

## Quick Start

```bash
npm install
npm run dev
```

The API runs on `http://localhost:4000` and the web app runs on `http://localhost:5173`.

## Demo Users

- `procurement@sosliberia.org` – Procurement Officer
- `finance@sosliberia.org` – Finance Controller
- `approver@sosliberia.org` – Budget Approver
- `warehouse@sosliberia.org` – Warehouse Officer
- `auditor@sosliberia.org` – Internal Auditor

## Documentation

- [Architecture](./docs/architecture.md)
- [Implementation Plan](./docs/implementation-plan.md)
- [Deployment Guide](./docs/deployment-guide.md)
- [User Manual](./docs/user-manual.md)
- [Training Plan](./docs/training-plan.md)
- [Support Plan](./docs/support-plan.md)
