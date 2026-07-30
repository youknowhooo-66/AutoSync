#!/usr/bin/env bash
# certify-p6.sh — AutoSync P6 certification script.
#
# Orchestrates the full P6 validation suite in the correct order:
#  1. Environment validation
#  2. P5 regression (unit + integration + E2E)
#  3. TypeScript typecheck
#  4. Production build
#  5. Stack startup (Docker)
#  6. Healthcheck probes
#  7. Smoke tests
#  8. Correlation ID verification
#  9. Graceful shutdown validation
# 10. Backup (local test database)
# 11. Restore validation (test only)
# 12. Resilience tests (only with --allow-disruption)
# 13. Final report
#
# Usage:
#   ./scripts/certify-p6.sh                          # safe mode (no disruption)
#   ./scripts/certify-p6.sh --allow-disruption       # enables PostgreSQL/Redis chaos tests

set -euo pipefail

ALLOW_DISRUPTION=false
PRESERVE_TEST_DB=false
API_PORT="${API_PORT:-3000}"
DB_TEST_URL="${DATABASE_URL:-postgresql://postgres:admin123@localhost:5436/autosync_test?schema=public}"

for arg in "$@"; do
  case $arg in
    --allow-disruption) ALLOW_DISRUPTION=true ;;
    --preserve-test-db) PRESERVE_TEST_DB=true ;;
  esac
done

PASS=0
FAIL=0
REPORT_LINES=()

log()  { echo "[P6] $1"; }
ok()   { echo "[P6] ✅ $1"; PASS=$((PASS+1)); REPORT_LINES+=("PASS: $1"); }
fail() { echo "[P6] ❌ $1"; FAIL=$((FAIL+1)); REPORT_LINES+=("FAIL: $1"); }

# ── Guard: DATABASE_URL must point to test database ──────────────────────────
DB_NAME=$(python3 -c "import urllib.parse, sys; u=urllib.parse.urlparse(sys.argv[1]); print(u.path.lstrip('/'))" "$DB_TEST_URL" 2>/dev/null || echo "")
if [[ "$DB_NAME" != *_test ]] && [[ "$DB_NAME" != *_staging ]]; then
  echo "[P6] ERROR: DATABASE_URL must point to a test or staging database (ends with _test or _staging)." >&2
  echo "[P6] Current: $DB_NAME" >&2
  exit 1
fi
log "Database guard passed: $DB_NAME"

# ── 1. Environment check ──────────────────────────────────────────────────────
log "Checking required tools..."
for tool in node pnpm docker pg_dump pg_restore; do
  if command -v "$tool" &>/dev/null; then
    ok "$tool found ($(command -v "$tool"))"
  else
    fail "$tool not found"
  fi
done

# ── 2. P5 regression ──────────────────────────────────────────────────────────
log "Running P5 regression (unit + integration + E2E)..."
if DATABASE_URL="$DB_TEST_URL" pnpm --filter back run test --reporter=verbose 2>&1; then
  ok "P5 regression passed"
else
  fail "P5 regression FAILED — cannot certify P6"
  exit 1
fi

# ── 3. TypeScript typecheck ───────────────────────────────────────────────────
log "Running TypeScript typecheck..."
if pnpm --filter back run typecheck 2>&1; then
  ok "Backend typecheck passed"
else
  fail "Backend typecheck failed"
fi

if pnpm --filter front run typecheck 2>&1; then
  ok "Frontend typecheck passed"
else
  fail "Frontend typecheck failed"
fi

# ── 4. Production build ───────────────────────────────────────────────────────
log "Running production build..."
if pnpm run build 2>&1; then
  ok "Monorepo build passed"
else
  fail "Monorepo build failed"
fi

# ── 5. Docker stack startup ───────────────────────────────────────────────────
log "Starting Docker test stack..."
docker compose -f docker-compose.test.yml up -d --wait 2>&1 || {
  fail "Docker test stack failed to start"
  exit 1
}
ok "Docker test stack started"

# Wait for API to become healthy (up to 60s).
API_BASE="http://localhost:$API_PORT"
for i in $(seq 1 12); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/health/ready" 2>/dev/null || echo "000")
  if [[ "$STATUS" -eq 200 ]]; then
    ok "API readiness probe returned 200 (attempt $i)"
    break
  fi
  if [[ $i -eq 12 ]]; then
    fail "API did not become ready within 60s (last status: $STATUS)"
    exit 1
  fi
  sleep 5
done

# ── 6. Smoke tests ────────────────────────────────────────────────────────────
log "Running smoke tests..."
if API_BASE_URL="$API_BASE" ./scripts/smoke-p6.sh 2>&1; then
  ok "Smoke tests passed"
else
  fail "Smoke tests failed"
fi

# ── 7. Correlation ID verification ───────────────────────────────────────────
log "Verifying correlation ID..."
CORR="550e8400-e29b-41d4-a716-446655440099"
RETURNED=$(curl -s -D - -H "x-correlation-id: $CORR" "$API_BASE/health/live" \
  | grep -i "x-correlation-id:" | tr -d '\r' | awk '{print $2}')
if [[ "$RETURNED" == "$CORR" ]]; then
  ok "Correlation ID propagated correctly"
else
  fail "Correlation ID not propagated (got: $RETURNED)"
fi

# ── 8. Backup ─────────────────────────────────────────────────────────────────
log "Running backup test..."
BACKUP_DIR="./backups/p6-test"
if DATABASE_URL="$DB_TEST_URL" BACKUP_DIR="$BACKUP_DIR" ./scripts/backup-postgres.sh 2>&1; then
  ok "Backup completed"
  BACKUP_FILE=$(ls -t "$BACKUP_DIR"/*.dump 2>/dev/null | head -1)
else
  fail "Backup failed"
  BACKUP_FILE=""
fi

# ── 9. Restore validation ─────────────────────────────────────────────────────
if [[ -n "${BACKUP_FILE:-}" ]] && [[ -f "${BACKUP_FILE:-}" ]]; then
  log "Running restore validation..."
  if RESTORE_DATABASE_URL="$DB_TEST_URL" BACKUP_FILE="$BACKUP_FILE" \
     ./scripts/restore-postgres-test.sh --confirm 2>&1; then
    ok "Restore completed successfully"
  else
    fail "Restore failed"
  fi
else
  fail "Restore skipped — no backup file available"
fi

# ── 10. Resilience tests (optional) ──────────────────────────────────────────
if [[ "$ALLOW_DISRUPTION" == "true" ]]; then
  log "⚠️  Running PostgreSQL resilience test (--allow-disruption)..."

  # Verify readiness is 200 before disruption.
  STATUS_BEFORE=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/health/ready")
  if [[ "$STATUS_BEFORE" -eq 200 ]]; then
    ok "Readiness is 200 before PostgreSQL stop"
  else
    fail "Readiness is not 200 before disruption test ($STATUS_BEFORE)"
  fi

  # Stop PostgreSQL container.
  docker compose -f docker-compose.test.yml stop db
  sleep 5

  # Readiness should now return 503.
  STATUS_DOWN=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/health/ready")
  if [[ "$STATUS_DOWN" -eq 503 ]]; then
    ok "Readiness correctly returns 503 when PostgreSQL is stopped"
  else
    fail "Expected readiness 503 with PostgreSQL stopped, got $STATUS_DOWN"
  fi

  # Restore PostgreSQL.
  docker compose -f docker-compose.test.yml start db
  sleep 10

  # Readiness should recover.
  STATUS_AFTER=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/health/ready")
  if [[ "$STATUS_AFTER" -eq 200 ]]; then
    ok "Readiness recovered to 200 after PostgreSQL restart"
  else
    fail "Readiness did not recover after PostgreSQL restart (got $STATUS_AFTER)"
  fi
else
  log "PostgreSQL resilience test skipped (pass --allow-disruption to enable)"
fi

# ── 11. Graceful shutdown test ────────────────────────────────────────────────
log "Testing graceful shutdown..."
if [[ "$ALLOW_DISRUPTION" == "true" ]]; then
  # Get API container ID and send SIGTERM.
  API_CONTAINER=$(docker compose -f docker-compose.test.yml ps -q api 2>/dev/null || echo "")
  if [[ -n "$API_CONTAINER" ]]; then
    docker kill --signal=SIGTERM "$API_CONTAINER" 2>&1 || true
    sleep 5
    if ! curl -s "$API_BASE/health/live" &>/dev/null; then
      ok "API shut down cleanly after SIGTERM"
    else
      fail "API still responding after SIGTERM"
    fi
    # Restart API for subsequent steps.
    docker compose -f docker-compose.test.yml up -d api 2>&1
    sleep 15
  else
    fail "Could not find API container for SIGTERM test"
  fi
else
  log "Graceful shutdown test skipped (pass --allow-disruption to enable)"
fi

# ── 12. Cleanup (optional) ────────────────────────────────────────────────────
if [[ "$PRESERVE_TEST_DB" != "true" ]]; then
  log "Stopping Docker test stack..."
  docker compose -f docker-compose.test.yml down 2>&1 || true
  ok "Docker test stack stopped"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "[P6] ══════════════════════════════════════════════════"
echo "[P6] P6 CERTIFICATION REPORT"
echo "[P6] ══════════════════════════════════════════════════"
echo "[P6] PASS: $PASS"
echo "[P6] FAIL: $FAIL"
echo "[P6] Disruption tests: $ALLOW_DISRUPTION"
echo "[P6] ══════════════════════════════════════════════════"
for line in "${REPORT_LINES[@]}"; do
  echo "[P6]   $line"
done
echo "[P6] ══════════════════════════════════════════════════"

if [[ "$FAIL" -gt 0 ]]; then
  echo "[P6] ❌ CERTIFICATION FAILED"
  exit 1
fi
echo "[P6] ✅ CERTIFICATION PASSED"
exit 0
