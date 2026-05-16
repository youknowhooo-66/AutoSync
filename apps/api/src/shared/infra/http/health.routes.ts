import { Router } from 'express';
import { prismaClient } from '../../database/prismaClient';
import { QueueProvider } from '../../queue/QueueProvider';
import { logger } from '../../logger';

const healthRouter = Router();

healthRouter.get('/health', async (req, res) => {
  const status = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    database: 'down',
    redis: 'down',
    api: 'up'
  };

  try {
    // 1. Check Database
    await prismaClient.$queryRaw`SELECT 1`;
    status.database = 'up';

    // 2. Check Redis
    const redisQueue = QueueProvider.getQueue('health_check');
    (await redisQueue.client).ping();
    status.redis = 'up';

    const isHealthy = status.database === 'up' && status.redis === 'up';

    return res.status(isHealthy ? 200 : 503).json(status);
  } catch (error: unknown) {
  if (error instanceof Error) {
    logger.error({ err: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }, '[HealthCheck] Status check failed');
    return res.status(503).json(status);
  } else {
    logger.error({ err: error }, "An unknown error occurred");
      return res.status(500).json({ message: 'An unknown error occurred' });  }
}
});

export { healthRouter };
