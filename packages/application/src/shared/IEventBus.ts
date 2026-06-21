import { DomainEvent } from '@autosync/domain';

export interface IEventBus {
  /**
   * Dispatches a single domain event.
   */
  dispatch(event: DomainEvent<any>): Promise<void>;

  /**
   * Dispatches multiple domain events sequentially or concurrently.
   */
  dispatchAll(events: ReadonlyArray<DomainEvent<any>>): Promise<void>;
}
