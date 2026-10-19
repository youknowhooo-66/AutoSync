import Redis from 'ioredis';
import { env } from '../../config/env';
import { logger } from '../../logger';

// REDIS_URL (e.g. redis://:password@redis:6379) takes precedence, matching
// QueueProvider; host/port/password are the fallback for local setups.
export const redisClient = env.REDIS_URL
  ? new Redis(env.REDIS_URL, { maxRetriesPerRequest: null })
  : new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
    });

redisClient.on('connect', () => logger.info('🚀 Redis connected'));
redisClient.on('error', (error) => logger.error(error, '❌ Redis error:'));
