import type { EventType, DomainEvent } from './eventTypes';

type EventHandler = (event: DomainEvent) => void | Promise<void>;

class EventBus {
  private subscribers: Map<EventType, Set<EventHandler>>;

  constructor() {
    this.subscribers = new Map();
  }

  subscribe(type: EventType, handler: EventHandler): () => void {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }
    this.subscribers.get(type)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.unsubscribe(type, handler);
    };
  }

  unsubscribe(type: EventType, handler: EventHandler) {
    const handlers = this.subscribers.get(type);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.subscribers.delete(type);
      }
    }
  }

  publish(event: DomainEvent) {
    const handlers = this.subscribers.get(event.type);
    if (handlers) {
      handlers.forEach(handler => {
        // Run async to avoid blocking the publisher
        Promise.resolve().then(() => handler(event)).catch(error => {
          console.error(`Error executing event handler for ${event.type}:`, error);
        });
      });
    }
  }

  clear() {
    this.subscribers.clear();
  }
}

export const eventBus = new EventBus();
