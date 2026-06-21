import { DomainEvent } from '@autosync/domain';

export interface IEventStore {
  append(event: DomainEvent<unknown>): Promise<void>;
  appendAll(events: ReadonlyArray<DomainEvent<unknown>>): Promise<void>;
  getAll(): Promise<DomainEvent<unknown>[]>;
  getByEventType(eventType: string): Promise<DomainEvent<unknown>[]>;
  clear(): Promise<void>;
}

export class InMemoryEventStore implements IEventStore {
  private events: DomainEvent<unknown>[] = [];

  async append(event: DomainEvent<unknown>): Promise<void> {
    this.events.push(event);
  }

  async appendAll(events: ReadonlyArray<DomainEvent<unknown>>): Promise<void> {
    this.events.push(...events);
  }

  async getAll(): Promise<DomainEvent<unknown>[]> {
    return [...this.events].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );
  }

  async getByEventType(eventType: string): Promise<DomainEvent<unknown>[]> {
    const all = await this.getAll();
    return all.filter((e) => e.eventType === eventType);
  }

  async clear(): Promise<void> {
    this.events = [];
  }
}
