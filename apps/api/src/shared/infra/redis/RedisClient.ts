import Redis from 'ioredis';
import { env } from '../../config/env';
import { logger } from '../../utils/Logger';

const redisConfig = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
};

export const redisClient = new Redis(redisConfig);

redisClient.on('connect', () => logger.info('🚀 Redis connected'));
redisClient.on('error', (error) => logger.error(error, '❌ Redis error:'));
