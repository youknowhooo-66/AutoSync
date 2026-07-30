/**
 * server.ts — entry point for the AutoSync API.
 *
 * Startup sequence:
 *  1. Validate environment variables (via env.ts — throws on failure).
 *  2. Verify PostgreSQL connectivity with bounded retries.
 *  3. Attempt Redis ping (degradable — does not block startup).
 *  4. Mark application as ready.
 *  5. Open HTTP port.
 *
 * The port is opened AFTER the database check is confirmed, ensuring the
 * readiness probe only receives traffic after dependencies are validated.
 *
 * Shutdown sequence (SIGTERM / SIGINT):
 *  1. Mark application as shutting_down (readiness returns 503 immediately).
 *  2. Stop accepting new HTTP connections.
 *  3. Wait for in-flight requests to finish (10 s max).
 *  4. Close BullMQ workers.
 *  5. Close Redis client.
 *  6. Disconnect Prisma.
 *  7. Exit cleanly.
 */

import 'dotenv/config';
import { env } from './shared/config/env';
import { logger } from './shared/logger';
import { prismaClient } from './shared/database/prismaClient';
import { redisClient } from './shared/infra/redis/RedisClient';
import { applicationState } from './shared/health/ApplicationState';
import app from './app';
import http from 'http';

// ── Startup constants ────────────────────────────────────────────────────────
const PORT = env.PORT;
const DB_RETRY_ATTEMPTS = 5;
const DB_RETRY_DELAYS_MS = [500, 1000, 2000, 4000]; // ~7.5 s total
const SHUTDOWN_TIMEOUT_MS = 10_000;

// ── PostgreSQL fail-fast bootstrap ──────────────────────────────────────────
async function connectDatabase(): Promise<void> {
  for (let attempt = 1; attempt <= DB_RETRY_ATTEMPTS; attempt++) {
    try {
      await prismaClient.$queryRaw`SELECT 1`;
      logger.info(`[Bootstrap] PostgreSQL connected (attempt ${attempt})`);
      return;
    } catch (err) {
      if (attempt === DB_RETRY_ATTEMPTS) {
        logger.error(
          { err },
          '[Bootstrap] PostgreSQL unreachable after all retries — terminating',
        );
        throw err;
      }
      const delayMs = DB_RETRY_DELAYS_MS[attempt - 1] ?? 4000;
      logger.warn(
        { attempt, delayMs },
        '[Bootstrap] PostgreSQL unavailable — retrying',
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

// ── Redis degradable bootstrap ───────────────────────────────────────────────
async function connectRedis(): Promise<void> {
  try {
    const result = await Promise.race([
      redisClient.ping(),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Redis ping timeout')), 2000),
      ),
    ]);
    if (result === 'PONG') {
      logger.info('[Bootstrap] Redis connected');
    } else {
      logger.warn('[Bootstrap] Redis ping returned unexpected response — degraded');
    }
  } catch (err) {
    logger.warn(
      { err },
      '[Bootstrap] Redis unavailable at startup — API will start in degraded mode. Queue-dependent features will be impaired.',
    );
    // Redis is degradable; we do NOT exit here.
  }
}

// ── Graceful shutdown ─────────────────────────────────────────────────────────
let shuttingDown = false;

async function shutdown(signal: string, server: http.Server): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info({ signal }, '[Shutdown] Signal received — starting graceful shutdown');

  // Immediately mark as shutting down so readiness returns 503.
  applicationState.setShuttingDown();

  const forceExit = setTimeout(() => {
    logger.error('[Shutdown] Graceful shutdown timed out — forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  try {
    // 1. Stop accepting new connections; wait for in-flight requests.
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve())),
    );
    logger.info('[Shutdown] HTTP server closed');

    // 2. Close Redis (ioredis disconnect is synchronous-ish but wrapped).
    try {
      await redisClient.quit();
      logger.info('[Shutdown] Redis disconnected');
    } catch (err) {
      logger.warn({ err }, '[Shutdown] Redis disconnect error (non-fatal)');
    }

    // 3. Disconnect Prisma.
    await prismaClient.$disconnect();
    logger.info('[Shutdown] Prisma disconnected');

    clearTimeout(forceExit);
    logger.info('[Shutdown] Graceful shutdown complete');
    process.exit(0);
  } catch (err) {
    logger.error({ err }, '[Shutdown] Error during graceful shutdown');
    clearTimeout(forceExit);
    process.exit(1);
  }
}

// ── Main bootstrap ─────────────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  logger.info('[Bootstrap] Starting AutoSync API...');

  // 1. Connect database (mandatory — exits on failure).
  await connectDatabase();

  // 2. Connect Redis (degradable — only logs on failure).
  await connectRedis();

  // 3. Mark application ready before opening the port.
  applicationState.setReady();

  // 4. Create HTTP server and register signal handlers.
  const server = http.createServer(app);

  process.on('SIGTERM', () => shutdown('SIGTERM', server));
  process.on('SIGINT', () => shutdown('SIGINT', server));

  // 5. Open port.
  server.listen(PORT, '0.0.0.0', () => {
    logger.info(
      { port: PORT, env: env.NODE_ENV },
      `[Bootstrap] AutoSync API listening on port ${PORT}`,
    );
  });
}

bootstrap().catch((err) => {
  logger.error({ err }, '[Bootstrap] Fatal startup error — terminating');
  process.exit(1);
});
