import { DomainEvent } from '@autosync/domain';

export interface IHandlerIdempotencyStore {
  hasBeenProcessed(eventId: string, handlerName: string): Promise<boolean>;
  markAsProcessed(eventId: string, handlerName: string): Promise<void>;
}

export type SecureHandlerFactory = <T extends DomainEvent<unknown>>(
  handlerName: string,
  handler: (event: T) => Promise<void>,
) => (event: T) => Promise<void>;

export function withProjectionHandlerIdempotency(
  store: IHandlerIdempotencyStore,
): SecureHandlerFactory {
  return (handlerName, handler) => {
    return async (event) => {
      if (!event.eventId) {
        return handler(event);
      }

      const processed = await store.hasBeenProcessed(event.eventId, handlerName);
      if (processed) return;

      await handler(event);
      await store.markAsProcessed(event.eventId, handlerName);
    };
  };
}
