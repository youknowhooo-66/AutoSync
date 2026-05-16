import { Queue, Worker, QueueOptions, WorkerOptions, JobsOptions } from 'bullmq';
import { logger } from '../logger';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
};

export class QueueProvider {
  private static queues: Record<string, Queue> = {};

  public static getQueue(name: string, options?: QueueOptions): Queue {
    if (!this.queues[name]) {
      this.queues[name] = new Queue(name, {
        connection: redisConfig,
        defaultJobOptions: {
          attempts: 5, // Increased retries for production
          backoff: {
            type: 'exponential',
            delay: 2000, // 2s initial delay
          },
          removeOnComplete: {
            age: 24 * 3600, // Keep for 24h
            count: 1000,
          },
          removeOnFail: false, // DO NOT remove on fail -> this is our DLQ
        },
        ...options,
      });
      logger.info(`[QueueProvider] Production Resilience Queue registered: ${name}`);
    }
    return this.queues[name];
  }

  public static createWorker(
    name: string, 
    processor: (job: any) => Promise<void>, 
    options?: WorkerOptions
  ): Worker {
    const worker = new Worker(name, processor, {
      connection: redisConfig,
      ...options,
    });

    worker.on('completed', (job) => {
      logger.info(`[Worker:${name}] Job ${job.id} completed successfully.`);
    });

    worker.on('failed', (job, err) => {
      logger.error({ err: err }, `[Worker:${name}] Job ${job?.id} failed: ${err.message}`);
    });

    return worker;
  }
}
