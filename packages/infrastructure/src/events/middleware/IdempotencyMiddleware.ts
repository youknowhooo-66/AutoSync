export interface IIdempotencyStore {
  hasBeenProcessed(eventId: string, handlerName: string): Promise<boolean>;
  markAsProcessed(eventId: string, handlerName: string, resultHash?: string): Promise<void>;
}

export class InMemoryIdempotencyStore implements IIdempotencyStore {
  // Key: eventId:handlerName
  private processed = new Set<string>();

  async hasBeenProcessed(eventId: string, handlerName: string): Promise<boolean> {
    return this.processed.has(`${eventId}:${handlerName}`);
  }

  async markAsProcessed(eventId: string, handlerName: string, _resultHash?: string): Promise<void> {
    this.processed.add(`${eventId}:${handlerName}`);
  }
}

/**
 * Wraps a handler to provide idempotency guarantees.
 */
export function withIdempotency<T>(
  handlerName: string,
  store: IIdempotencyStore,
  handler: (event: T) => Promise<void>
): (event: T) => Promise<void> {
  return async (event: any) => {
    const eventId = event.eventId;
    
    if (!eventId) {
      console.warn(`[IdempotencyMiddleware] Event missing eventId, cannot guarantee idempotency. Handler: ${handlerName}`);
      return handler(event);
    }

    const processed = await store.hasBeenProcessed(eventId, handlerName);
    if (processed) {
      console.log(`[IdempotencyMiddleware] Event ${eventId} already processed by ${handlerName}. Skipping.`);
      return;
    }

    await handler(event);
    
    await store.markAsProcessed(eventId, handlerName);
  };
}
