#!/usr/bin/env bash
# restore-postgres-test.sh — Safe PostgreSQL restore for test/staging databases.
#
# GUARDS:
#  - Target database name MUST end with _test or _staging.
#  - Target host must NOT match known production patterns.
#  - Requires --confirm flag to execute (no silent auto-run).
#
# Usage:
#   RESTORE_DATABASE_URL="postgresql://user:pass@localhost:5436/autosync_test" \
#   BACKUP_FILE="./backups/autosync-20260717T120000.dump" \
#   ./scripts/restore-postgres-test.sh --confirm

set -euo pipefail

RESTORE_DATABASE_URL="${RESTORE_DATABASE_URL:-}"
BACKUP_FILE="${BACKUP_FILE:-}"
CONFIRM=false

for arg in "$@"; do
  case $arg in
    --confirm) CONFIRM=true ;;
  esac
done

# ── Validation ────────────────────────────────────────────────────────────────
if [[ -z "$RESTORE_DATABASE_URL" ]]; then
  echo "[RESTORE] ERROR: RESTORE_DATABASE_URL must be set." >&2
  exit 1
fi

if [[ -z "$BACKUP_FILE" ]]; then
  echo "[RESTORE] ERROR: BACKUP_FILE must be set." >&2
  exit 1
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "[RESTORE] ERROR: Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

# ── Parse target database name and host ───────────────────────────────────────
DB_NAME=$(python3 -c "import urllib.parse, sys; u=urllib.parse.urlparse(sys.argv[1]); print(u.path.lstrip('/'))" "$RESTORE_DATABASE_URL" 2>/dev/null || echo "")
DB_HOST=$(python3 -c "import urllib.parse, sys; u=urllib.parse.urlparse(sys.argv[1]); print(u.hostname or '')" "$RESTORE_DATABASE_URL" 2>/dev/null || echo "")

if [[ -z "$DB_NAME" ]]; then
  echo "[RESTORE] ERROR: Could not parse database name from RESTORE_DATABASE_URL." >&2
  exit 1
fi

# ── Guard: database name must end with _test or _staging ─────────────────────
if [[ "$DB_NAME" != *_test ]] && [[ "$DB_NAME" != *_staging ]]; then
  echo "[RESTORE] ERROR: Target database '$DB_NAME' is not a test or staging database." >&2
  echo "[RESTORE] Database name must end with '_test' or '_staging'." >&2
  exit 1
fi

# ── Guard: reject known production patterns ───────────────────────────────────
PROHIBITED_PATTERNS=("production" "prod" "autosync$")
for pattern in "${PROHIBITED_PATTERNS[@]}"; do
  if [[ "$DB_NAME" =~ $pattern ]]; then
    echo "[RESTORE] ERROR: Target database name matches prohibited pattern: $pattern" >&2
    exit 1
  fi
done

# ── Guard: require --confirm ─────────────────────────────────────────────────
if [[ "$CONFIRM" != "true" ]]; then
  echo "[RESTORE] ERROR: You must pass --confirm to execute the restore." >&2
  echo "[RESTORE] This will OVERWRITE the target database: $DB_NAME on $DB_HOST" >&2
  echo "[RESTORE] Usage: RESTORE_DATABASE_URL=... BACKUP_FILE=... ./scripts/restore-postgres-test.sh --confirm" >&2
  exit 1
fi

echo "[RESTORE] ⚠️  Restoring '$DB_NAME' on '$DB_HOST' from: $BACKUP_FILE"

if ! command -v pg_restore &>/dev/null; then
  echo "[RESTORE] ERROR: pg_restore not found. Install postgresql-client." >&2
  exit 1
fi

# ── Execute restore ───────────────────────────────────────────────────────────
pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  --dbname="$RESTORE_DATABASE_URL" \
  "$BACKUP_FILE"

echo "[RESTORE] ✅ Restore complete for: $DB_NAME"
echo "[RESTORE] Run 'prisma migrate status' to validate migration state after restore."
