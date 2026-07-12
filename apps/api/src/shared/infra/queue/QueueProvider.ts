import { Queue, Worker, Job } from 'bullmq';
import { redisClient } from '../redis/RedisClient';
import { logger } from '../../utils/Logger';

export class QueueProvider {
  private queues: Map<string, Queue> = new Map();

  constructor() {}

  public getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      const queue = new Queue(name, { connection: redisClient as any });
      this.queues.set(name, queue);
    }
    return this.queues.get(name)!;
  }

  public async add(queueName: string, data: any) {
    const queue = this.getQueue(queueName);
    await queue.add(`${queueName}_job`, data);
  }

  public createWorker(queueName: string, processor: (job: Job) => Promise<void>) {
    const worker = new Worker(queueName, processor, { connection: redisClient as any });

    worker.on('completed', (job) => {
      logger.info(`✅ Job ${job.id} from queue ${queueName} completed`);
    });

    worker.on('failed', (job, err) => {
      logger.error(`❌ Job ${job?.id} from queue ${queueName} failed: ${err.message}`);
    });

    return worker;
  }
}

export const queueProvider = new QueueProvider();
