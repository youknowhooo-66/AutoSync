import { DomainEvent } from '@autosync/domain';
import { OutboxEvent } from './OutboxEvent';

import { IEventBus } from '@autosync/application';

export interface IOutboxStore {
  save(event: OutboxEvent): Promise<void>;
  findPending(limit: number): Promise<OutboxEvent[]>;
}

/**
 * Intercepts events from the application layer and persists them
 * inside the same transactional boundary (simulated via outbox store here).
 */
export class OutboxWriter implements IEventBus {
  constructor(private readonly outboxStore: IOutboxStore) {}

  async writeAll(events: ReadonlyArray<DomainEvent<any>>): Promise<void> {
    for (const event of events) {
      const outboxEvent = OutboxEvent.fromDomainEvent(event);
      await this.outboxStore.save(outboxEvent);
    }
  }

  async write(event: DomainEvent<any>): Promise<void> {
    const outboxEvent = OutboxEvent.fromDomainEvent(event);
    await this.outboxStore.save(outboxEvent);
  }

  async dispatch(event: DomainEvent<any>): Promise<void> {
    await this.write(event);
  }

  async dispatchAll(events: ReadonlyArray<DomainEvent<any>>): Promise<void> {
    await this.writeAll(events);
  }
}
