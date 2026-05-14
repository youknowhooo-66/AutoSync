import { QueueProvider } from '../queue/QueueProvider';
import { logger } from '../logger';

export interface IDomainEvent {
  name: string;
  payload: any;
  occurredAt: Date;
  correlationId?: string;
}

export class EventDispatcher {
  private static eventsQueue = QueueProvider.getQueue('events_queue');

  public static async dispatch(event: IDomainEvent): Promise<void> {
    logger.info(`[EventDispatcher] Dispatching event: ${event.name}`, {
      correlationId: event.correlationId,
      eventName: event.name,
    });

    // We push to BullMQ for asynchronous processing by dedicated workers
    await this.eventsQueue.add(event.name, event, {
      jobId: `${event.name}:${Date.now()}`, // Simple idempotency hint
    });
  }
}
