/**
 * DomainEvent — base structure for all domain events.
 *
 * Every event in the system:
 * - Is immutable (a fact that happened)
 * - Has full metadata for correlation, tenancy and auditing
 * - Carries a versioned payload
 *
 * Rule (event-contracts.md): All events MUST include:
 *   eventId, eventType, timestamp, companyId, correlationId, payload, version
 */
export interface DomainEventMetadata {
  readonly eventId: string;
  readonly eventType: string;
  readonly timestamp: Date;
  readonly companyId: string;
  readonly correlationId: string;
  readonly version: string;
}

export interface DomainEvent<TPayload> extends DomainEventMetadata {
  readonly payload: TPayload;
}

/**
 * Helper to build the base metadata for a domain event.
 * Accepts a pre-generated eventId for deterministic testing.
 */
export function buildEventMetadata(params: {
  eventType: string;
  companyId: string;
  correlationId: string;
  version: string;
  eventId?: string;
}): DomainEventMetadata {
  return {
    eventId: params.eventId ?? generateUUID(),
    eventType: params.eventType,
    timestamp: new Date(),
    companyId: params.companyId,
    correlationId: params.correlationId,
    version: params.version,
  };
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
