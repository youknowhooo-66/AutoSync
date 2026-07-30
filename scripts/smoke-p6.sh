#!/usr/bin/env bash
# smoke-p6.sh — AutoSync P6 smoke test script
#
# Executes lightweight probes against a running API instance.
# By default runs only public/read-only checks (no data written).
# Use --full-lifecycle to run the complete OS lifecycle (requires write access
# and SMOKE_ALLOW_WRITES=true).
#
# Usage:
#   API_BASE_URL=https://api.staging.yourdomain.com ./scripts/smoke-p6.sh
#   API_BASE_URL=http://localhost:3000 SMOKE_USER_EMAIL=test@co.com SMOKE_USER_PASSWORD=pass \
#     ./scripts/smoke-p6.sh --authenticated
#   API_BASE_URL=https://api.staging.yourdomain.com \
#     SMOKE_USER_EMAIL=smoke@test.com SMOKE_USER_PASSWORD=s3cr3t \
#     SMOKE_ALLOW_WRITES=true SMOKE_TENANT_PREFIX=P6-SMOKE \
#     ./scripts/smoke-p6.sh --full-lifecycle

set -euo pipefail

# ── Inputs ───────────────────────────────────────────────────────────────────
API_BASE_URL="${API_BASE_URL:-http://localhost:3000}"
SMOKE_USER_EMAIL="${SMOKE_USER_EMAIL:-}"
SMOKE_USER_PASSWORD="${SMOKE_USER_PASSWORD:-}"
SMOKE_ALLOW_WRITES="${SMOKE_ALLOW_WRITES:-false}"
SMOKE_TENANT_PREFIX="${SMOKE_TENANT_PREFIX:-P6-SMOKE}"
FULL_LIFECYCLE=false
AUTHENTICATED=false

for arg in "$@"; do
  case $arg in
    --full-lifecycle) FULL_LIFECYCLE=true; AUTHENTICATED=true ;;
    --authenticated)  AUTHENTICATED=true ;;
  esac
done

# Require HTTPS in production-like environments (unless explicitly overriding).
if [[ "$API_BASE_URL" != http://localhost* ]] && [[ "$API_BASE_URL" != https://* ]]; then
  echo "[SMOKE] ERROR: API_BASE_URL must use HTTPS in non-localhost environments: $API_BASE_URL" >&2
  exit 1
fi

PASS=0
FAIL=0

pass() { echo "[SMOKE] ✅ PASS: $1"; PASS=$((PASS + 1)); }
fail() { echo "[SMOKE] ❌ FAIL: $1"; FAIL=$((FAIL + 1)); }
info() { echo "[SMOKE] ℹ️  $1"; }

# ── Helper: make a request and check expected HTTP status ────────────────────
check_status() {
  local label="$1"
  local method="$2"
  local url="$3"
  local expected_status="$4"
  shift 4
  local extra_args=("$@")

  local actual_status
  actual_status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "${extra_args[@]}" "$url")

  if [[ "$actual_status" -eq "$expected_status" ]]; then
    pass "$label (HTTP $actual_status)"
  else
    fail "$label (expected $expected_status, got $actual_status)"
  fi
}

# ── 1. Liveness ───────────────────────────────────────────────────────────────
info "Checking liveness..."
check_status "GET /health/live" GET "$API_BASE_URL/health/live" 200

# ── 2. Readiness ──────────────────────────────────────────────────────────────
info "Checking readiness..."
check_status "GET /health/ready" GET "$API_BASE_URL/health/ready" 200

# ── 3. Correlation ID ─────────────────────────────────────────────────────────
info "Checking correlation ID propagation..."
CORR_ID="550e8400-e29b-41d4-a716-446655440099"
RETURNED_CORR=$(curl -s -o /dev/null -D - -H "x-correlation-id: $CORR_ID" "$API_BASE_URL/health/live" \
  | grep -i "x-correlation-id" | tr -d '\r' | awk '{print $2}')
if [[ "$RETURNED_CORR" == "$CORR_ID" ]]; then
  pass "x-correlation-id header propagated correctly"
else
  fail "x-correlation-id not propagated (got: $RETURNED_CORR)"
fi

# ── 4. Authentication (optional) ─────────────────────────────────────────────
if [[ "$AUTHENTICATED" == "true" ]]; then
  if [[ -z "$SMOKE_USER_EMAIL" ]] || [[ -z "$SMOKE_USER_PASSWORD" ]]; then
    info "SMOKE_USER_EMAIL / SMOKE_USER_PASSWORD not set — skipping authenticated checks"
    AUTHENTICATED=false
  else
    info "Authenticating as $SMOKE_USER_EMAIL..."
    AUTH_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/api/auth/sessions" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$SMOKE_USER_EMAIL\"}")
    AUTH_STATUS=$(echo "$AUTH_RESPONSE" | tail -1)
    AUTH_BODY=$(echo "$AUTH_RESPONSE" | head -1)

    if [[ "$AUTH_STATUS" -eq 200 ]]; then
      TOKEN=$(echo "$AUTH_BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
      pass "POST /api/auth/sessions (login)"
    else
      fail "POST /api/auth/sessions returned $AUTH_STATUS — skipping authenticated checks"
      AUTHENTICATED=false
    fi
  fi
fi

# ── 5. Authenticated read probe ───────────────────────────────────────────────
if [[ "$AUTHENTICATED" == "true" ]] && [[ -n "${TOKEN:-}" ]]; then
  info "Testing authenticated request..."
  check_status "GET /api/clients (auth)" GET "$API_BASE_URL/api/clients" 200 \
    -H "Authorization: Bearer $TOKEN"
fi

# ── 6. Full lifecycle (destructive — staging only) ───────────────────────────
if [[ "$FULL_LIFECYCLE" == "true" ]]; then
  if [[ "$SMOKE_ALLOW_WRITES" != "true" ]]; then
    fail "--full-lifecycle requires SMOKE_ALLOW_WRITES=true. This prevents accidental writes to non-disposable environments."
    FAIL=$((FAIL + 1))
  elif [[ -z "${TOKEN:-}" ]]; then
    fail "--full-lifecycle requires successful authentication first"
  else
    info "⚠️  Full lifecycle smoke — this WILL create data in $API_BASE_URL with prefix $SMOKE_TENANT_PREFIX"
    # Full lifecycle is implemented in certify-p6.sh using the E2E test suite.
    info "Full lifecycle is delegated to certify-p6.sh which reuses the Vitest E2E suite against the real URL."
    info "Run: API_BASE_URL=$API_BASE_URL ./scripts/certify-p6.sh --allow-disruption"
  fi
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "[SMOKE] ════════════════════════════════════"
echo "[SMOKE] Results: $PASS passed, $FAIL failed"
echo "[SMOKE] API: $API_BASE_URL"
echo "[SMOKE] ════════════════════════════════════"

if [[ "$FAIL" -gt 0 ]]; then
  exit 1
fi
exit 0
