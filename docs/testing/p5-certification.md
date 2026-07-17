# AutoSync P5 Certification Guide

This document describes how to execute the AutoSync E2E lifecycle certification testing suite using the provided automation scripts.

## Prerequisites

Before running the certification, ensure your environment meets the following requirements:
- **Node.js**: `v22.20.0` or higher
- **pnpm**: `v11.1.2` or higher
- **Docker** and **Docker Compose**
- Active PostgreSQL & Redis test containers (managed automatically by docker-compose)

## Environment Variables

The certification suite reads configuration from the environment, defaulting to local testing credentials if not set.

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | The PostgreSQL connection string to target. | `postgresql://postgres:admin123@localhost:5436/autosync_test?schema=public` |
| `REDIS_URL` | Redis URL | `redis://localhost:6380` |
| `JWT_SECRET` | Secret key for signing authorization headers | `testsecret123` |

## Certification Executions

The script `scripts/certify-p5.sh` supports two modes of execution:

### 1. Clean Database Certification (Destructive Reset)
Forces Docker containers to recreation, destroying all existing volumes and executing the migrations on a blank database.

```bash
./scripts/certify-p5.sh clean
```

### 2. Existing Database Certification (Safe Run)
Starts or attaches to the existing containers and executes pending migrations without destroying existing databases or volume data.

```bash
./scripts/certify-p5.sh existing
# or simply
./scripts/certify-p5.sh
```

## Step-by-Step Validation Stages

The certification script performs the following gates:
1. **[P5 1/8]** Validates database target name against `autosync_test` to prevent accidental production overwrite.
2. **[P5 2/8]** Up/recreates test containers (`db_test` on `5436`, `redis_test` on `6380`).
3. **[P5 3/8]** Generates Prisma Client.
4. **[P5 4/8]** Deploys migrations to database (`prisma migrate deploy`).
5. **[P5 5/8]** Confirms migration status has zero drifts.
6. **[P5 6/8]** Runs TypeScript typecheck in both frontend & backend packages.
7. **[P5 7/8]** Runs backend integration & E2E lifecycle test suite (126 tests passing).
8. **[P5 8/8]** Builds all 9 monorepo workspaces (`turbo run build`).

## Clean Environment

To stop and remove test containers and volumes:
```bash
docker compose -f docker-compose.test.yml down -v
```
