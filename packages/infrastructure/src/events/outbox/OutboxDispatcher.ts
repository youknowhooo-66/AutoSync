import { IEventBus } from '@autosync/application';
import { IOutboxStore } from './OutboxWriter';
import { RetryPolicy } from '../failure/RetryPolicy';
import { IDeadLetterQueue } from '../failure/DeadLetterQueue';

export class OutboxDispatcher {
  constructor(
    private readonly outboxStore: IOutboxStore,
    private readonly eventBus: IEventBus,
    private readonly retryPolicy: RetryPolicy,
    private readonly dlq: IDeadLetterQueue,
  ) {}

  async processPendingEvents(batchSize: number = 10): Promise<void> {
    const pendingEvents = await this.outboxStore.findPending(batchSize);

    for (const outboxEvent of pendingEvents) {
      try {
        const domainEvent = outboxEvent.getOriginalEvent();
        
        // Dispatch internally (which will go through IdempotencyMiddleware)
        await this.eventBus.dispatch(domainEvent);

        // Success: mark as sent
        const sentEvent = outboxEvent.markAsSent();
        await this.outboxStore.save(sentEvent);

      } catch (error: any) {
        if (this.retryPolicy.shouldRetry(outboxEvent.retries)) {
          // Increment retries
          const failedEvent = outboxEvent.markAsFailed();
          await this.outboxStore.save(failedEvent);
          
          // Normally we'd use getBackoffMs to delay the next pickup, 
          // but for simplicity in this synchronous polling model, 
          // we just save the failed state and let the next poll pick it up.
          console.error(`[OutboxDispatcher] Failed to dispatch event ${outboxEvent.id}. Retrying...`, error);
        } else {
          // Exhausted retries -> DLQ
          console.error(`[OutboxDispatcher] Exhausted retries for event ${outboxEvent.id}. Sending to DLQ.`);
          await this.dlq.push(outboxEvent, error.message || 'Unknown error');
          
          // Mark as sent/failed permanently in outbox so it doesn't get picked up again
          const deadEvent = outboxEvent.markAsSent(); // or a specific terminal status
          await this.outboxStore.save(deadEvent);
        }
      }
    }
  }
}
