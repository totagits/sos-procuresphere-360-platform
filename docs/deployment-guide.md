# Deployment Guide

## Local Development
1. Copy `.env.example` to `.env` if you want to override defaults.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open `http://localhost:5173` for the web app and `http://localhost:4000/docs` for API docs.

## Container Deployment
1. Ensure Docker is installed.
2. Run `docker compose up --build`.
3. Access:
   - Web: `http://localhost:8080`
   - API: `http://localhost:4000`
   - MinIO console: `http://localhost:9001`

## Google Cloud Run
1. Ensure `gcloud` is authenticated to the target project.
2. Confirm Artifact Registry exists in the target region.
3. Run:

```powershell
./infra/deploy-cloud-run.ps1 -ProjectId sba-msme-portal-lr -Region europe-west1
```

4. The script:
   - builds and deploys `sos-procuresphere-360-api`
   - resolves the API URL
   - builds the web image with `VITE_API_URL` pointed at that API
   - deploys the web service as `sos-procuresphere-360`

5. After deployment:
   - Web is served from the `sos-procuresphere-360` Cloud Run URL
   - API is served from the `sos-procuresphere-360-api` Cloud Run URL

## Production Recommendation
- Host frontend behind a managed load balancer or CDN.
- Run API containers behind an application gateway with TLS termination.
- Use managed PostgreSQL and Redis where possible.
- Replace local upload storage with S3-compatible object storage.
- Connect OIDC or SAML identity provider and enable MFA.
- Run automated backups for database and object storage with restore drills every quarter.

## Disaster Recovery
- Database backup: daily full backup + point-in-time recovery
- Object storage replication: cross-zone or cross-region bucket replication
- Restore target: RPO under 24 hours, RTO under 4 hours for core operations
- DR drill cadence: twice yearly

## Environment Variables
- `PORT`: API port
- `DATABASE_URL`: Prisma/PostgreSQL connection string
- `REDIS_URL`: background job cache and queue endpoint
- `S3_ENDPOINT`: object storage endpoint
- `S3_BUCKET`: procurement evidence bucket
- `AUTH_MODE`: `demo` or future production auth mode
- `BANK_ADAPTER`: `mock` or bank-specific adapter identifier
