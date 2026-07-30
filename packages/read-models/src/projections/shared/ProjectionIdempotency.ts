export interface IProjectionIdempotencyTracker {
  hasProcessed(eventId: string, scope: string): Promise<boolean>;
  markProcessed(eventId: string, scope: string): Promise<void>;
  clear(): Promise<void>;
}

export class InMemoryProjectionIdempotencyTracker implements IProjectionIdempotencyTracker {
  private processed = new Set<string>();

  async hasProcessed(eventId: string, scope: string): Promise<boolean> {
    return this.processed.has(`${eventId}:${scope}`);
  }

  async markProcessed(eventId: string, scope: string): Promise<void> {
    this.processed.add(`${eventId}:${scope}`);
  }

  async clear(): Promise<void> {
    this.processed.clear();
  }
}

export async function withProjectionIdempotency(
  tracker: IProjectionIdempotencyTracker,
  eventId: string,
  scope: string,
  fn: () => Promise<void>,
): Promise<void> {
  if (await tracker.hasProcessed(eventId, scope)) return;
  await fn();
  await tracker.markProcessed(eventId, scope);
}
