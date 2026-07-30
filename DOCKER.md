# AutoSync Docker Deployment Guide

This guide details the complete Dockerization of the AutoSync enterprise monorepo using `pnpm` workspaces and `turbo`.

## Architecture Overview

The system is split into multiple isolated services via Docker Compose:
- **`db`**: PostgreSQL container with persistent volume and healthchecks.
- **`redis`**: Redis caching and message broker.
- **`api`**: Node.js + Prisma backend, served behind a highly optimized Alpine-based container.
- **`worker`**: Background job processing worker for scaling queue execution.
- **`frontend`**: React + Vite static bundle served securely via Nginx.

## Available Commands

These commands can be run from the root of the project to manage the Docker lifecycle:

- `pnpm docker:dev` -> Starts the development environment with hot-reloading using `docker-compose.dev.yml`.
- `pnpm docker:up` -> Starts the production environment in detached mode using the main `docker-compose.yml`.
- `pnpm docker:down` -> Stops all containers and network instances.
- `pnpm docker:logs` -> Displays tailing logs of all running containers.
- `pnpm docker:build` -> Rebuilds all production Docker images from scratch.

## 1. Local Development Mode

The development mode ensures that you can edit code on your machine and see changes immediately within the Docker environment without rebuilding the containers.

```bash
# 1. Ensure you have copied the environment variables
cp .env.example .env

# 2. Run the development environment
pnpm docker:dev
```

*Note: In `docker:dev`, packages are installed and cached within a Docker volume, while your code is bind-mounted. Turbo cache works locally to speed up execution.*

## 2. Production Mode

The production mode is for staging or deployment environments where you want everything locked down, built properly via `turbo prune`, and optimized.

```bash
# 1. Build and start production
pnpm docker:build
pnpm docker:up
```

## How the Dockerfiles Work

We use Vercel's `turbo prune` specifically tailored for Docker.

1. **Pruning Stage**: Turbo extracts *only* the dependencies required for a specific app (e.g. `api` or `web`).
2. **Install Stage**: PNPM performs a frozen lockfile installation only of the extracted files to heavily cache the `node_modules` layer.
3. **Build Stage**: The application builds leveraging turbo cache. Prisma client is generated in the context.
4. **Runner Stage**: A slim alpine container executes the pre-built artifacts without dev dependencies. For frontend, Nginx is used.

### Prisma Migration inside Docker

If you need to run Prisma migrations inside the Docker container once the database is up:

```bash
# Production API execution
docker exec -it autosync_api pnpm --filter back exec prisma migrate deploy

# Development API execution
docker exec -it autosync_api_dev pnpm --filter back exec prisma migrate dev
```

## Security & Best Practices Implemented

- Complete dependency isolation utilizing `.dockerignore`.
- Application runs as a non-root user (`expressjs`).
- Pre-built optimized artifacts and multi-stage builds.
- Database waits on healthchecks before starting dependent services.
- Automatic restart policies for resilience.
