import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { QueueProvider } from '../shared/queue/QueueProvider';
import { EventDispatcher, IDomainEvent } from '../shared/events/EventDispatcher';
import { Queue, Worker } from 'bullmq';

describe('Queue and Event Dispatching Integration', () => {
  let testQueue: Queue;
  let testWorker: Worker;
  const processedJobs: any[] = [];

  beforeAll(() => {
    testQueue = QueueProvider.getQueue('test_queue');
  });

  afterAll(async () => {
    if (testWorker) {
      await testWorker.close();
    }
    if (testQueue) {
      await testQueue.close();
    }
    // Clean up EventDispatcher static queue connection to avoid open handles
    const eventsQueue = QueueProvider.getQueue('events_queue');
    await eventsQueue.close();
  });

  it('should register a queue successfully', () => {
    expect(testQueue).toBeInstanceOf(Queue);
    expect(testQueue.name).toBe('test_queue');
  });

  it('should dispatch an event and add it to events_queue', async () => {
    const event: IDomainEvent = {
      name: 'CLIENT_CREATED',
      payload: { clientId: 'client-1', companyId: 'comp-1' },
      occurredAt: new Date(),
    };

    await EventDispatcher.dispatch(event);

    const eventsQueue = QueueProvider.getQueue('events_queue');
    const jobs = await eventsQueue.getJobs(['waiting', 'delayed', 'completed', 'failed']);
    const foundJob = jobs.find(j => j.name === 'CLIENT_CREATED');
    expect(foundJob).toBeDefined();
    expect(foundJob?.data.payload.clientId).toBe('client-1');
  });

  it('should process a queued job using a worker', async () => {
    let resolveProcess: (value: unknown) => void;
    const processPromise = new Promise((resolve) => {
      resolveProcess = resolve;
    });

    testWorker = QueueProvider.createWorker('test_queue', async (job) => {
      processedJobs.push(job.data);
      resolveProcess(true);
    });

    // Add a job to test_queue
    await testQueue.add('test_job', { value: 42 });

    // Wait for the worker to process the job
    await processPromise;

    expect(processedJobs.length).toBe(1);
    expect(processedJobs[0].value).toBe(42);
  });
});
