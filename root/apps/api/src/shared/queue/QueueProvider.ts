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
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
        ...options,
      });
      logger.info(`[QueueProvider] Queue registered: ${name}`);
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
      logger.error(`[Worker:${name}] Job ${job?.id} failed: ${err.message}`, { error: err });
    });

    return worker;
  }
}
