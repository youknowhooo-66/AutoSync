import { Entity } from './Entity';
import { UniqueEntityId } from './UniqueEntityId';
import { DomainEvent } from './DomainEvent';

/**
 * AggregateRoot — extends Entity with domain event collection.
 *
 * Events are collected in memory during the aggregate's lifecycle.
 * The application layer (Use Cases) is responsible for dispatching them
 * after successfully persisting the aggregate state.
 *
 * Invariant: events are never dispatched directly from within the domain.
 */
export abstract class AggregateRoot<TProps> extends Entity<TProps> {
  private _domainEvents: DomainEvent<unknown>[] = [];

  protected constructor(props: TProps, id?: UniqueEntityId) {
    super(props, id);
  }

  get domainEvents(): ReadonlyArray<DomainEvent<unknown>> {
    return this._domainEvents;
  }

  protected addDomainEvent(event: DomainEvent<unknown>): void {
    this._domainEvents.push(event);
  }

  clearEvents(): void {
    this._domainEvents = [];
  }
}
