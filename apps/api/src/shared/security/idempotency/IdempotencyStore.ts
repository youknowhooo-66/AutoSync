import { logger } from '../../logger';

export class IdempotencyStore {
  // In a real production SaaS, this would use Redis with an expiry (TTL)
  private static processedEvents = new Set<string>();

  public static async isDuplicate(eventId: string): Promise<boolean> {
    if (this.processedEvents.has(eventId)) {
      logger.warn(`[Security:Idempotency] Duplicate event detected and blocked: ${eventId}`);
      return true;
    }
    return false;
  }

  public static async markAsProcessed(eventId: string): Promise<void> {
    this.processedEvents.add(eventId);
    
    // Auto-cleanup for memory management in this mock version
    if (this.processedEvents.size > 10000) {
      this.processedEvents.clear();
    }
  }
}
