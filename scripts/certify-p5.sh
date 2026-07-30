#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Defaults
RESET_DB=false
DATABASE_URL="${DATABASE_URL:-postgresql://postgres:admin123@localhost:5436/autosync_test?schema=public}"
export DATABASE_URL

# Parse arguments
for arg in "$@"; do
  case "$arg" in
    clean|--reset-test-db)
      RESET_DB=true
      ;;
    existing|--preserve-test-db)
      RESET_DB=false
      ;;
    *)
      echo "Unknown option: $arg"
      echo "Usage: $0 [clean|--reset-test-db] [existing|--preserve-test-db]"
      exit 1
      ;;
  esac
done

assert_test_database() {
  case "$DATABASE_URL" in
    *autosync_test*) ;;
    *)
      echo "ERROR: Refusing to run: DATABASE_URL is not a test database"
      exit 1
      ;;
  esac
}

wait_for_postgres() {
  echo "📡 Waiting for PostgreSQL database to be healthy..."
  local retries=30
  until docker exec autosync_db_test pg_isready -U postgres -d autosync_test &>/dev/null || [ $retries -eq 0 ]; do
    sleep 1
    retries=$((retries - 1))
  done
  if [ $retries -eq 0 ]; then
    echo "❌ Timeout waiting for PostgreSQL database"
    exit 1
  fi
  echo "✅ PostgreSQL is ready."
}

cleanup() {
  echo "🧹 Done."
}

trap cleanup EXIT

echo "============================================="
echo "       AutoSync P5 Certification Script      "
echo "============================================="

echo "[P5 1/8] Validating database environment..."
assert_test_database

if [ "$RESET_DB" = true ]; then
  echo "[P5 2/8] Recreating test containers and volumes (--reset-test-db)..."
  docker compose -f docker-compose.test.yml down -v
  docker compose -f docker-compose.test.yml up -d
else
  echo "[P5 2/8] Ensuring test containers are running (--preserve-test-db)..."
  docker compose -f docker-compose.test.yml up -d
fi

wait_for_postgres

echo "[P5 3/8] Generating Prisma client..."
pnpm --filter back exec prisma generate --schema=prisma/schema.prisma

echo "[P5 4/8] Running migrate deploy on test database..."
pnpm --filter back exec prisma migrate deploy --schema=prisma/schema.prisma

echo "[P5 5/8] Verifying migration status..."
pnpm --filter back exec prisma migrate status --schema=prisma/schema.prisma

echo "[P5 6/8] Running static typecheck..."
pnpm --filter back run typecheck
pnpm --filter front exec tsc --noEmit

echo "[P5 7/8] Running backend integration and E2E tests..."
pnpm --filter back run test

echo "[P5 8/8] Building monorepo packages..."
pnpm run build

echo "============================================="
echo "🎉 SUCCESS: P5 Certification Passed!"
echo "============================================="
