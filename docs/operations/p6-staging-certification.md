# AutoSync P6 — Staging Certification Guide

This guide describes how to deploy AutoSync to a staging environment, validate readiness, and run the P6 certification suite.

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | v22+ |
| pnpm | v11+ |
| Docker | v29+ |
| Docker Compose | v5+ |
| PostgreSQL client (`pg_dump`, `pg_restore`) | v15+ |
| `curl`, `jq` | any |

---

## Topology

```text
Browser
  ↓ HTTPS
Frontend (Nginx / Vercel)
  ↓ HTTPS /api
API (Express, port 3000)
  ├─ PostgreSQL (port 5432 internal)
  ├─ Redis (port 6379 internal)
  └─ BullMQ Workers (same process or separate container)
```

**Rules:**
- PostgreSQL and Redis must NOT be exposed to the internet directly.
- API must be behind a reverse proxy with TLS termination.
- Frontend must set `VITE_API_URL` to the HTTPS API domain.

---

## Environment Variables

### Required — API

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@db:5432/autosync_staging` |
| `JWT_SECRET` | Signing key, minimum 16 chars | (secret — never hardcode) |
| `NODE_ENV` | Runtime environment | `staging` |
| `PORT` | HTTP port | `3000` |
| `CORS_ORIGIN` | Allowed frontend origin(s) | `https://staging.yourdomain.com` |
| `REDIS_URL` | Redis connection string | `redis://redis:6379` |

### Optional — API

| Variable | Description | Default |
|---|---|---|
| `LOG_LEVEL` | Pino log level | `info` |
| `APP_VERSION` | Injected version identifier | (unset) |
| `GIT_SHA` | Short commit SHA | (unset) |
| `METRICS_TOKEN` | Bearer token for `/metrics` | (unset = disabled) |

### Required — Frontend

| Variable | Description |
|---|---|
| `VITE_API_URL` | Full HTTPS URL to the API | `https://api.staging.yourdomain.com` |

> **Security**: Never commit `.env` files. Store secrets in provider secret managers (GitHub Secrets, AWS Secrets Manager, etc.).

---

## Startup Sequence

The API follows a fail-fast startup procedure:

1. Validate all required environment variables via Zod schema (process exits immediately on failure).
2. Verify PostgreSQL connectivity with up to **5 retries** (delays: 500ms, 1s, 2s, 4s — total ≈ 7.5s).
3. Attempt Redis ping (degradable — logs warning but does NOT exit on failure).
4. Mark application state as `ready`.
5. Open HTTP port.

**The port is opened only after PostgreSQL connectivity is confirmed.**

---

## Migration Strategy

```bash
# ALWAYS use migrate deploy (not migrate dev) in staging/production.
DATABASE_URL="..." pnpm --filter back exec prisma migrate deploy --schema=prisma/schema.prisma
```

**Rules:**
- Migrations must complete before the API starts accepting traffic.
- Never run `migrate dev` outside of local development.
- Never run `migrate reset` in staging or production.
- Rolling deploys: ensure migrations are backward-compatible with the previous API version before deploying.

---

## Healthchecks

### Liveness
```
GET /health/live
```
Returns `200 OK` if the Node process is alive. Does NOT check any dependency.  
Used by: Kubernetes liveness probe, Docker healthcheck for "is the process up?"

### Readiness
```
GET /health/ready
```
Returns `200 OK` with `{ status: "ready" }` when PostgreSQL is up.  
Returns `503 Service Unavailable` when PostgreSQL is down or the app is starting/shutting down.

| `checks.database` | `checks.redis` | HTTP Status |
|---|---|---|
| `up` | `up` | 200 |
| `up` | `degraded` | 200 (Redis is degradable) |
| `down` | any | 503 |

### Deprecated alias
```
GET /health
```
Same as `/health/live`. Kept for backwards compatibility.

---

## Staging Docker Compose

The API container healthcheck uses Node's built-in `fetch` (Node 18+):
```yaml
healthcheck:
  test:
    - CMD
    - node
    - -e
    - "fetch('http://127.0.0.1:3000/health/ready').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
  interval: 30s
  timeout: 5s
  start_period: 30s
  retries: 3
```

PostgreSQL uses `pg_isready`. Redis uses `redis-cli ping`.

---

## Smoke Tests

```bash
# Basic smoke (no auth required)
API_BASE_URL=https://api.staging.yourdomain.com ./scripts/smoke-p6.sh

# Authenticated smoke
API_BASE_URL=https://api.staging.yourdomain.com \
  SMOKE_USER_EMAIL=smoke@test.com \
  SMOKE_USER_PASSWORD=yourpassword \
  ./scripts/smoke-p6.sh --authenticated
```

---

## Backup

```bash
DATABASE_URL="postgresql://..." BACKUP_DIR="./backups" ./scripts/backup-postgres.sh
```

- Output: `./backups/<dbname>-<timestamp>.dump`
- Format: `pg_dump --format=custom` (compressed internally)
- Permissions: `600` (owner read/write only)

---

## Restore (Test / Staging Only)

```bash
RESTORE_DATABASE_URL="postgresql://user:pass@localhost:5436/autosync_test" \
BACKUP_FILE="./backups/autosync-20260717T120000.dump" \
./scripts/restore-postgres-test.sh --confirm
```

Guards:
- Database name must end with `_test` or `_staging`.
- `--confirm` flag is required.
- Prohibited production name patterns are blocked.

---

## Application Rollback

1. Identify the previous stable Git SHA.
2. Re-deploy image tagged with that SHA.
3. Verify `/health/ready`.
4. Run smoke tests.
5. Monitor 5xx rate for 5 minutes.

---

## Migration Compatibility Matrix

| Migration | Type | Backward Compatible | App Rollback Safe |
|---|---|---|---|
| `20260514171202_finalize_schema` | Additive | Yes | Yes |
| `20260625051051_add_part_labor_to_worktype` | Additive | Yes | Yes |
| `20260716033149_add_service_order_budget_approval` | Additive | Yes | Yes |
| `20260716035128_add_os_service_execution` | Additive | Yes | Yes |
| `20260716041013_add_service_order_stock_consumption` | Additive | Yes | Yes |
| `20260716042627_add_service_order_completion_fields` | Additive | Yes | Yes |
| `20260717040613_add_service_order_financial_links` | Additive (FK + unique) | Yes | Yes |

All P4 migrations are additive. Rolling back application code does not require rolling back the database schema.

---

## Security Posture

| Control | Status |
|---|---|
| Helmet HTTP headers | ✅ Active |
| CORS restricted to configured origins | ✅ Active (warn: `*` in dev only) |
| Auth rate limit (20 req / 15 min per IP) | ✅ Active on `/api/auth/sessions` |
| API rate limit (1000 req / 15 min per IP) | ✅ Active on `/api/` |
| Body size limit (10 MB) | ✅ Active |
| JWT_SECRET min 16 chars (no insecure default) | ✅ Enforced via Zod |
| Correlation ID never logged with sensitive data | ✅ Reviewed |
| Stack trace suppressed in staging/production | ✅ Enforced in errorHandler |

---

## CI/CD

The existing `.github/workflows/ci.yml` runs:
1. Backend typecheck + tests with test database.
2. Frontend typecheck + tests.
3. Monorepo build.

A staging deployment pipeline (`deploy-staging.yml`) is **blocked pending provider configuration**. When a provider is selected, the pipeline should implement:
```text
checkout → install → typecheck → test → build → push image → migrate deploy → deploy → wait readiness → smoke test
```

---

## Redis Classification

Redis is a **degradable** dependency in the current AutoSync architecture:
- The core OS lifecycle (create → diagnose → approve → execute → consume → complete → receivable) operates without Redis.
- BullMQ-based event workers require Redis. If Redis is unavailable, background events queue up and are processed on recovery.
- Readiness returns `200` with `checks.redis = "degraded"` when Redis is down.
- Restore Redis connectivity to resume full background processing.

---

## Limitations

| Item | Status |
|---|---|
| Kubernetes deployment | Not implemented |
| Rolling deploy / zero-downtime | Not configured (single instance) |
| Prometheus metrics endpoint | Deferred to P6.1 / P7 |
| APM integration (Sentry, Datadog) | Optional — not installed |
| Browser E2E (Playwright) | Not implemented |
| Remote staging URL configured | Blocked pending provider |
