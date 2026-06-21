import { IOutboxStore, OutboxWriter } from './OutboxWriter';
import { OutboxEvent } from './OutboxEvent';

export class InMemoryOutboxStore implements IOutboxStore {
  private events: Map<string, OutboxEvent> = new Map();

  async save(event: OutboxEvent): Promise<void> {
    this.events.set(event.id, event);
  }

  async findPending(limit: number): Promise<OutboxEvent[]> {
    const pending: OutboxEvent[] = [];
    for (const event of this.events.values()) {
      if (event.status === 'PENDING') {
        pending.push(event);
      }
      if (pending.length >= limit) {
        break;
      }
    }
    return pending;
  }

  // Helper for tests
  async getById(id: string): Promise<OutboxEvent | null> {
    return this.events.get(id) || null;
  }
}
