# AutoSync — Incident Response Playbook

This document describes how to identify, diagnose, and recover from incidents in the AutoSync API.

---

## Incident Severity Levels

| Severity | Description | Example |
|---|---|---|
| **P0** | Data loss or total service unavailability | Database unreachable, API crashed, migration destroyed data |
| **P1** | Critical flow unavailable | Cannot create/complete Service Orders, auth broken |
| **P2** | Partial degradation | Redis unavailable, one endpoint returning 5xx |
| **P3** | Minor issue | Slow response on non-critical endpoint, cosmetic error |

---

## 1. How to Identify an Incident

### Via healthchecks
```bash
# Liveness (is the process alive?)
curl https://api.yourdomain.com/health/live

# Readiness (are dependencies available?)
curl https://api.yourdomain.com/health/ready
```

A `503` on `/health/ready` indicates PostgreSQL or the application state is unhealthy.  
A `200` on `/health/live` but `503` on `/health/ready` indicates a dependency issue (not a process crash).

### Via logs
Logs are structured JSON. Use your log aggregator (e.g., CloudWatch, Papertrail, Loki) with:

```json
{ "level": "error" }
```

Useful fields to filter:
- `correlationId` — trace a single request across the entire system
- `statusCode` — filter by HTTP status
- `companyId` — narrow to a specific tenant
- `error.code` — filter by specific business error

### Via API monitoring
Watch the HTTP 5xx rate. Alert threshold: `> 5% over 5 minutes`.

---

## 2. How to Locate a Correlation ID

Every response includes the header:
```http
x-correlation-id: 550e8400-e29b-41d4-a716-446655440000
```

For errors surfaced to users, the response body also contains:
```json
{
  "error": {
    "correlationId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

Use this ID to search all logs for a complete trace of that request.

---

## 3. How to Inspect Logs

### Docker / local
```bash
docker logs autosync_api --follow
docker logs autosync_api --since 30m
```

### Filter by correlation ID (jq)
```bash
docker logs autosync_api 2>&1 | jq 'select(.correlationId == "YOUR-ID-HERE")'
```

### Filter errors
```bash
docker logs autosync_api 2>&1 | jq 'select(.level == "error")'
```

---

## 4. How to Verify Database Status

```bash
# Check readiness
curl http://localhost:3000/health/ready | jq .checks.database

# Direct Prisma check
DATABASE_URL="..." pnpm --filter back exec prisma db pull 2>&1 | head -5

# Migration status
DATABASE_URL="..." pnpm --filter back exec prisma migrate status --schema=prisma/schema.prisma
```

---

## 5. How to Verify Redis Status

```bash
# Via readiness endpoint
curl http://localhost:3000/health/ready | jq .checks.redis

# Direct ping
redis-cli -h $REDIS_HOST -p $REDIS_PORT ping

# Via Docker
docker exec autosync_redis redis-cli ping
```

Redis is classified as **degradable**. If `checks.redis = "degraded"` but `status = "ready"`, queue-based features are impaired but core OS flows remain available.

---

## 6. How to Verify Migrations

```bash
DATABASE_URL="..." pnpm --filter back exec prisma migrate status --schema=prisma/schema.prisma
```

Expected output:
```
All migrations have been applied.
```

If migrations are pending:
```bash
# NEVER use migrate dev in production/staging
DATABASE_URL="..." pnpm --filter back exec prisma migrate deploy --schema=prisma/schema.prisma
```

---

## 7. How to Restart the Service

### Docker Compose
```bash
docker compose restart api

# Or hard restart
docker compose stop api && docker compose up -d api
```

### After restart — verify
```bash
curl http://localhost:3000/health/ready
curl http://localhost:3000/health/live
```

---

## 8. How to Execute Application Rollback

> **Important**: Roll back code first. Rolling back a destructive migration requires a separate, planned procedure.

### Steps
1. Identify the last stable Docker image tag (should match a Git SHA):
   ```bash
   git log --oneline -5
   ```
2. Re-deploy the previous image:
   ```bash
   # If using Docker Compose with image tags:
   GIT_SHA=<previous-sha> docker compose up -d api
   ```
3. Verify readiness:
   ```bash
   curl http://localhost:3000/health/ready
   ```
4. Run smoke tests:
   ```bash
   API_BASE_URL=http://localhost:3000 ./scripts/smoke-p6.sh
   ```
5. Monitor error rate for 5 minutes.

### Migration rollback rules
- **Additive migrations** (add column, add table): rollback of application code is safe.
- **Destructive migrations** (drop column, drop table): rollback of application code may fail if the old code requires the dropped structure. Requires explicit forward fix.
- **Never** run `prisma migrate reset` in production.

---

## 9. How to Open an Incident

1. Capture the correlation ID (from logs or response header).
2. Capture the health endpoint output:
   ```bash
   curl https://api.yourdomain.com/health/ready
   ```
3. Capture recent error logs:
   ```bash
   docker logs autosync_api --since 15m 2>&1 | jq 'select(.level == "error")' | tail -50
   ```
4. Document: time of first occurrence, impacted flows, affected tenant(s).
5. Classify severity (P0–P3) and escalate accordingly.

---

## 10. Data Integrity Checks (Post-Incident)

After recovering from a database connectivity incident, verify:

```sql
-- Stock reconciliation
SELECT os.id, op."consumedQuantity",
  COALESCE(SUM(im.quantity), 0) AS ledger_total
FROM "OSPart" op
JOIN "ServiceOrder" os ON os.id = op."serviceOrderId"
LEFT JOIN "InventoryMovement" im ON im."osPartId" = op.id AND im.type = 'OUT'
GROUP BY os.id, op.id, op."consumedQuantity"
HAVING op."consumedQuantity" != COALESCE(SUM(im.quantity), 0);
-- Expected: 0 rows

-- Financial reconciliation
SELECT so.id, soa."finalValue", fr.amount
FROM "FinancialRecord" fr
JOIN "ServiceOrder" so ON so.id = fr."serviceOrderId"
JOIN "ServiceOrderApproval" soa ON soa.id = fr."serviceOrderApprovalId"
WHERE soa."finalValue" != fr.amount;
-- Expected: 0 rows
```

---

## 11. Runbooks (Quick Reference)

| Symptom | Runbook |
|---|---|
| API not starting | Check env vars, PostgreSQL connectivity, migrations |
| Readiness 503 | Check `checks.database` and `checks.redis` |
| PostgreSQL down | Restart container, verify data volume, check logs |
| Redis down | Restart container; API degrades gracefully |
| Migration failed | `prisma migrate status`, rollback code if needed |
| Stock inconsistency | Run reconciliation SQL above, open P0 incident |
| Receivable duplicated | Verify `FinancialRecord` unique constraint; P2002 should prevent dups |
| High latency | Check DB query times, Redis queue length |
