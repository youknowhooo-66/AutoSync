import { prismaClient } from '../database/prismaClient';
import { redisClient } from '../infra/redis/RedisClient';
import { logger } from '../logger';

export type DependencyStatus = 'up' | 'down' | 'degraded';

export interface ReadinessResult {
  status: 'ready' | 'not_ready';
  checks: {
    database: DependencyStatus;
    redis: DependencyStatus;
  };
  timestamp: string;
}

/**
 * Wraps a promise with an explicit timeout. Always clears the timer even on
 * early resolution to prevent timer leaks.
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  return Promise.race([
    promise.finally(() => {
      if (timer !== undefined) clearTimeout(timer);
    }),
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`[HealthService] ${label} check timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    }),
  ]);
}

/**
 * HealthService — performs dependency checks for readiness probes.
 *
 * Rules:
 *  - PostgreSQL is a mandatory dependency. DOWN → readiness not_ready (503).
 *  - Redis is a degradable dependency. DEGRADED → readiness still ready (200).
 *  - Each check has a short, bounded timeout to prevent hanging.
 *  - No data is written during health checks.
 *  - No internal connection strings or credentials are exposed.
 */
export class HealthService {
  private readonly dbTimeoutMs: number;
  private readonly redisTimeoutMs: number;

  constructor({ dbTimeoutMs = 2000, redisTimeoutMs = 1000 } = {}) {
    this.dbTimeoutMs = dbTimeoutMs;
    this.redisTimeoutMs = redisTimeoutMs;
  }

  async checkDatabase(): Promise<DependencyStatus> {
    try {
      await withTimeout(
        prismaClient.$queryRaw`SELECT 1`,
        this.dbTimeoutMs,
        'database',
      );
      return 'up';
    } catch (err) {
      logger.warn({ err }, '[HealthService] database check failed');
      return 'down';
    }
  }

  async checkRedis(): Promise<DependencyStatus> {
    try {
      const result = await withTimeout(
        redisClient.ping(),
        this.redisTimeoutMs,
        'redis',
      );
      return result === 'PONG' ? 'up' : 'degraded';
    } catch (err) {
      logger.warn({ err }, '[HealthService] redis check failed (degraded)');
      return 'degraded';
    }
  }

  async getReadiness(): Promise<ReadinessResult> {
    const [database, redis] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const isReady = database === 'up';

    return {
      status: isReady ? 'ready' : 'not_ready',
      checks: { database, redis },
      timestamp: new Date().toISOString(),
    };
  }
}

export const healthService = new HealthService();
