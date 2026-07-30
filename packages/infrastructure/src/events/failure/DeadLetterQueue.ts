import { OutboxEvent } from '../outbox/OutboxEvent';

export interface IDeadLetterQueue {
  push(event: OutboxEvent, reason: string): Promise<void>;
}

export class InMemoryDLQ implements IDeadLetterQueue {
  private messages: { event: OutboxEvent; reason: string; timestamp: Date }[] = [];

  async push(event: OutboxEvent, reason: string): Promise<void> {
    this.messages.push({
      event,
      reason,
      timestamp: new Date(),
    });
    console.warn(`[DLQ] Event ${event.id} moved to DLQ. Reason: ${reason}`);
  }

  getMessages() {
    return this.messages;
  }
}
