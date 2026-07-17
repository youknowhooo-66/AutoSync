# P6 Walkthrough — Staging, Observability and Operational Resilience

## Baseline

- **Branch**: `main`
- **P5 commit**: `7227d2ad` — `test(service-orders): certify full lifecycle end-to-end workflow`
- **Node**: v22.20.0
- **pnpm**: 11.1.2
- **Docker**: 29.4.3 / Compose v5.1.3

---

## Architecture of Deploy

```text
Browser
  ↓ HTTPS
Frontend (Nginx container, port 80)
  ↓ HTTPS /api/*
API (Express + Node 22, port 3000)
  ├─ PostgreSQL 15 (internal port 5432)
  ├─ Redis 7 (internal port 6379)
  └─ BullMQ Workers (in-process)
```

PostgreSQL and Redis are on an internal Docker network — never exposed to the internet.

---

## Files Changed

### Backend (apps/api)

| File | Action | Description |
|---|---|---|
| `src/server.ts` | Modified | Fail-fast PostgreSQL bootstrap, degradable Redis, graceful SIGTERM/SIGINT shutdown |
| `src/app.ts` | Modified | correlationIdMiddleware (first), requestLoggerMiddleware, healthRouter on /health, auth rate limiter, CORS with x-correlation-id/Idempotency-Key, removed morgan |
| `src/shared/config/env.ts` | Modified | Added staging to NODE_ENV, LOG_LEVEL, REDIS_URL, APP_VERSION, GIT_SHA, METRICS_TOKEN; JWT_SECRET min 16 chars; no insecure fallback |
| `src/shared/errors/AppError.ts` | Modified | Added `errorCode` (string) and typed `details: ErrorDetail[]` |
| `src/shared/middlewares/errorHandler.ts` | Modified | Uniform `{ error: { code, message, details, correlationId } }` envelope; Prisma error mapping; JWT error handling; stack hidden in production |
| `src/@types/express.d.ts` | Modified | Added `correlationId: string` to Express.Request |
| `src/shared/health/ApplicationState.ts` | New | Singleton lifecycle state: `starting` → `ready` → `shutting_down` |
| `src/shared/health/HealthService.ts` | New | DB check (2s timeout), Redis check (1s timeout), PostgreSQL mandatory, Redis degradable |
| `src/shared/infra/http/health.routes.ts` | Replaced | `/health/live` (no dependencies), `/health/ready` (delegates to HealthService), `/health` (deprecated alias) |
| `src/shared/middlewares/correlationIdMiddleware.ts` | New | Validates UUID from x-correlation-id, generates if absent/invalid, returns in response header |
| `src/shared/middlewares/requestLoggerMiddleware.ts` | New | One Pino log per request with method, path, status, duration, correlationId, tenant context. Never logs body |
| `tests/integration/platformResilience.test.ts` | New | Tests for liveness, readiness, app state, correlation ID, HealthService |

### Docker / Infra

| File | Action | Description |
|---|---|---|
| `docker-compose.yml` | Modified | API healthcheck using Node fetch on `/health/ready`, JWT_SECRET without fallback, CORS_ORIGIN env |

### Scripts

| File | Action | Description |
|---|---|---|
| `scripts/smoke-p6.sh` | New | Liveness, readiness, correlation ID, optional authenticated probe, --full-lifecycle guard |
| `scripts/certify-p6.sh` | New | Full certification: env check, P5 regression, typecheck, build, Docker, healthchecks, smoke, backup, restore, optional chaos |
| `scripts/backup-postgres.sh` | New | pg_dump custom format, timestamped, chmod 600 |
| `scripts/restore-postgres-test.sh` | New | pg_restore guarded to _test/_staging databases, --confirm required |

### Documentation

| File | Action | Description |
|---|---|---|
| `docs/operations/incident-response.md` | New | P0-P3 playbook, correlation ID lookup, log inspection, DB/Redis checks, migration validation, rollback procedure, data integrity SQL |
| `docs/operations/p6-staging-certification.md` | New | Topology, env vars, startup sequence, migration strategy, healthchecks, smoke tests, backup/restore, security posture, Redis classification, limitations |
| `docs/integration/frontend-readiness-report.md` | Modified | P6 section appended |

---

## Healthchecks

### Liveness (`GET /health/live`)
- Zero external dependencies
- Confirms Node process responds
- Returns `{ status: "ok", service, version, timestamp, uptimeSeconds }`
- Always `200 OK`

### Readiness (`GET /health/ready`)
- PostgreSQL check with **2-second timeout** via `withTimeout()`
- Redis check with **1-second timeout**
- `database = down` → HTTP `503 Service Unavailable`
- `redis = degraded` → HTTP `200 OK` (Redis is degradable)
- Application state `starting` or `shutting_down` → immediate `503` without checking dependencies

---

## Structured Logging

- Logger: **Pino** (`shared/logger/index.ts`) — JSON in production, pretty in development
- `LOG_LEVEL` environment variable controls verbosity
- `correlationId` included in all request logs
- Body is **never logged** regardless of route
- In production/staging: no stack traces, no internal Prisma metadata in responses

---

## Correlation IDs

Every response includes `x-correlation-id` header:
- Incoming UUID from header → reused if valid (UUID format, ≤ 100 chars)
- Missing or invalid → new `randomUUID()` generated
- Returned in all responses including errors
- Error envelope: `{ error: { ..., correlationId: "..." } }`

---

## Error Envelope

Uniform structure:
```json
{
  "success": false,
  "message": "Registro duplicado.",
  "statusCode": 409,
  "error": {
    "code": "DUPLICATE_RECORD",
    "message": "Registro duplicado.",
    "details": [],
    "correlationId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

Legacy fields (`success`, `message`, `statusCode`) maintained for backwards compatibility.

### Prisma Mapping

| Prisma Error | HTTP Status | Error Code |
|---|---|---|
| P2002 (unique constraint) | 409 | `DUPLICATE_RECORD` |
| P2003 (foreign key) | 409 | `FOREIGN_KEY_VIOLATION` |
| P2025 (record not found) | 404 | `RECORD_NOT_FOUND` |
| P1001 / P1008 (network/timeout) | 503 | `DATABASE_UNAVAILABLE` |
| PrismaClientInitializationError | 503 | `DATABASE_UNAVAILABLE` |
| Other Prisma errors | 500 | `INTERNAL_ERROR` |

---

## Security Improvements

| Control | Before | After |
|---|---|---|
| JWT_SECRET fallback | Insecure hardcoded string | Zod min 16 chars — no fallback |
| CORS allowed headers | Missing x-correlation-id, Idempotency-Key | Added |
| Auth rate limit | None | 20 req / 15 min on `/api/auth/sessions` |
| Stack in production | Returned in 500s | Hidden in production/staging |
| Prisma internal errors | Leaked raw Prisma messages | Mapped to safe messages |

---

## Resilience

### PostgreSQL
- Startup: fail-fast with 5 retries (500ms, 1s, 2s, 4s) — process exits if not reachable
- Runtime: readiness returns `503` when database query fails or times out (2s)
- Chaos test: available via `./scripts/certify-p6.sh --allow-disruption`

### Redis
- Startup: degradable — API starts without Redis, logs warning
- Runtime: readiness shows `degraded`, HTTP still `200`
- BullMQ workers impaired when Redis is down — queue resumes on reconnect

---

## Backup & Restore

```bash
# Backup
DATABASE_URL="..." ./scripts/backup-postgres.sh

# Restore (test/staging only)
RESTORE_DATABASE_URL="postgresql://...autosync_test" \
BACKUP_FILE="./backups/autosync-20260717T120000.dump" \
./scripts/restore-postgres-test.sh --confirm
```

---

## Migration Compatibility

All 7 migrations applied to date are **additive**. Application rollback is safe without a database migration rollback.

---

## CI/CD Status

| Gate | Status |
|---|---|
| Backend typecheck | ✅ Passing |
| Backend tests (P5 + P6) | ✅ Passing |
| Frontend typecheck | ✅ Passing |
| Frontend tests | ✅ Passing |
| Monorepo build (9/9) | ✅ Passing |
| Staging deploy automation | ⏳ Blocked pending provider configuration |

---

## Limitations

| Item | Status |
|---|---|
| Prometheus metrics (`/metrics`) | Deferred to P6.1 / P7 |
| APM / Sentry integration | Optional — not installed |
| Kubernetes / rolling deploy | Not configured |
| Browser E2E (Playwright) | Not implemented |
| Remote staging URL | Blocked pending provider |
