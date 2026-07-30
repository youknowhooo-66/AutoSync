import { eventBus } from './eventBus';
import type { EventType, EventPayload } from './eventTypes';

// Helper function to easily publish events correctly structured
export function publishDomainEvent(type: EventType, payload: EventPayload) {
  eventBus.publish({
    id: crypto.randomUUID(),
    type,
    payload
  });
}
