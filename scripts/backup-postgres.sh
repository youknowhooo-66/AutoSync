#!/usr/bin/env bash
# backup-postgres.sh — PostgreSQL backup utility for AutoSync.
#
# Creates a timestamped pg_dump in the custom format (already compressed).
# The output file uses the .dump extension and is chmod 600.
#
# Usage:
#   DATABASE_URL="postgresql://user:pass@host:5432/dbname" ./scripts/backup-postgres.sh
#   DATABASE_URL="..." BACKUP_DIR="/mnt/backups" ./scripts/backup-postgres.sh
#
# Credentials are consumed via DATABASE_URL and never echoed.

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
DATABASE_URL="${DATABASE_URL:-}"
TIMESTAMP=$(date +%Y%m%dT%H%M%S)

# ── Validation ────────────────────────────────────────────────────────────────
if [[ -z "$DATABASE_URL" ]]; then
  echo "[BACKUP] ERROR: DATABASE_URL must be set." >&2
  exit 1
fi

if ! command -v pg_dump &>/dev/null; then
  echo "[BACKUP] ERROR: pg_dump not found. Install postgresql-client." >&2
  exit 1
fi

# ── Parse database name from URL (for filename only — value not sensitive) ───
DB_NAME=$(python3 -c "import urllib.parse, sys; u=urllib.parse.urlparse(sys.argv[1]); print(u.path.lstrip('/'))" "$DATABASE_URL" 2>/dev/null || echo "autosync")

# ── Create destination directory with restricted permissions ─────────────────
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

BACKUP_FILE="$BACKUP_DIR/${DB_NAME}-${TIMESTAMP}.dump"

# ── Execute backup ────────────────────────────────────────────────────────────
echo "[BACKUP] Starting backup of $DB_NAME → $BACKUP_FILE"

# umask 177 → file created as 600 (owner read/write only)
(
  umask 177
  pg_dump \
    --format=custom \
    --file="$BACKUP_FILE" \
    "$DATABASE_URL"
)

# ── Verify output ─────────────────────────────────────────────────────────────
if [[ ! -s "$BACKUP_FILE" ]]; then
  echo "[BACKUP] ERROR: Backup file is empty or was not created." >&2
  rm -f "$BACKUP_FILE"
  exit 1
fi

FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[BACKUP] ✅ Backup complete: $BACKUP_FILE ($FILE_SIZE)"
echo "[BACKUP] Permissions: $(ls -la "$BACKUP_FILE" | awk '{print $1}')"
