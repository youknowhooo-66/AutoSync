import { logger } from "../../../../shared/logger";

export interface IDomainEvent {
  name: string;
  payload: any;
  occurredAt: Date;
}

type HandlerFunction = (payload: any) => Promise<void> | void;

export class EventBus {
  private static instance: EventBus;
  private handlers: Record<string, HandlerFunction[]> = {};

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public on(eventName: string, handler: HandlerFunction): void {
    if (!this.handlers[eventName]) {
      this.handlers[eventName] = [];
    }
    this.handlers[eventName].push(handler);
  }

  public async emit(event: IDomainEvent): Promise<void> {
    const handlers = this.handlers[event.name] || [];
    
    // We run handlers in parallel or sequence depending on requirements.
    // For now, simple execution.
    const promises = handlers.map(handler => {
      try {
        return handler(event.payload);
      } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`[EventBus] Error in handler for ${event.name}:`, error);
      } else {
        logger.error({ err: error }, "An unknown error occurred");
      }
    }
    });

    await Promise.all(promises);
  }
}

export const eventBus = EventBus.getInstance();
