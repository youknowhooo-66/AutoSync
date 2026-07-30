import { DomainEvent } from '@autosync/domain';

export type OutboxStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface OutboxEventProps {
  readonly id: string; // The same as the DomainEvent eventId
  readonly eventType: string;
  readonly payload: string; // Serialized JSON
  readonly status: OutboxStatus;
  readonly createdAt: Date;
  readonly processedAt: Date | null;
  readonly retries: number;
}

/**
 * OutboxEvent - Represents an event waiting to be dispatched to the message broker/event bus.
 */
export class OutboxEvent {
  private constructor(private readonly props: OutboxEventProps) {}

  get id(): string { return this.props.id; }
  get eventType(): string { return this.props.eventType; }
  get payload(): string { return this.props.payload; }
  get status(): OutboxStatus { return this.props.status; }
  get createdAt(): Date { return this.props.createdAt; }
  get processedAt(): Date | null { return this.props.processedAt; }
  get retries(): number { return this.props.retries; }

  markAsSent(): OutboxEvent {
    return new OutboxEvent({
      ...this.props,
      status: 'SENT',
      processedAt: new Date(),
    });
  }

  markAsFailed(): OutboxEvent {
    return new OutboxEvent({
      ...this.props,
      status: 'FAILED',
      retries: this.props.retries + 1,
      processedAt: new Date(), // Time of last failure
    });
  }

  getOriginalEvent(): DomainEvent<any> {
    return JSON.parse(this.payload) as DomainEvent<any>;
  }

  static fromDomainEvent(event: DomainEvent<any>): OutboxEvent {
    return new OutboxEvent({
      id: event.eventId,
      eventType: event.eventType,
      payload: JSON.stringify(event),
      status: 'PENDING',
      createdAt: event.timestamp || new Date(),
      processedAt: null,
      retries: 0,
    });
  }

  static reconstitute(props: OutboxEventProps): OutboxEvent {
    return new OutboxEvent(props);
  }
}
