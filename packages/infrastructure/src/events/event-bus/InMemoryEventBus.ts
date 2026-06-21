import { IEventBus } from '@autosync/application';
import { DomainEvent } from '@autosync/domain';

type EventHandler = (event: DomainEvent<any>) => Promise<void>;

export class InMemoryEventBus implements IEventBus {
  private handlers = new Map<string, EventHandler[]>();

  subscribe(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  async dispatch(event: DomainEvent<any>): Promise<void> {
    const eventHandlers = this.handlers.get(event.eventType) || [];
    
    // We execute all handlers concurrently. If one fails, it propagates up.
    // The outbox dispatcher will catch it and retry.
    // In a real message broker, each handler would be its own queue consumer.
    await Promise.all(eventHandlers.map(handler => handler(event)));
  }

  async dispatchAll(events: ReadonlyArray<DomainEvent<any>>): Promise<void> {
    for (const event of events) {
      await this.dispatch(event);
    }
  }
}
