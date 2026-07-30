import { DomainEvent, buildEventMetadata } from '../../shared/DomainEvent';

// ─── StockReserved.v1 ─────────────────────────────────────────────────────────

export interface StockReservedPayload {
  readonly stockItemId: string;
  readonly quantity: number;
  readonly workItemId: string;
}

export type StockReservedV1 = DomainEvent<StockReservedPayload>;

export function createStockReservedEvent(
  payload: StockReservedPayload,
  meta: { companyId: string; correlationId: string; eventId?: string },
): StockReservedV1 {
  return {
    ...buildEventMetadata({
      eventType: 'StockReserved',
      companyId: meta.companyId,
      correlationId: meta.correlationId,
      version: 'v1',
      eventId: meta.eventId,
    }),
    payload,
  };
}

// ─── StockConsumed.v1 ─────────────────────────────────────────────────────────

export interface StockConsumedPayload {
  readonly stockItemId: string;
  readonly quantity: number;
}

export type StockConsumedV1 = DomainEvent<StockConsumedPayload>;

export function createStockConsumedEvent(
  payload: StockConsumedPayload,
  meta: { companyId: string; correlationId: string; eventId?: string },
): StockConsumedV1 {
  return {
    ...buildEventMetadata({
      eventType: 'StockConsumed',
      companyId: meta.companyId,
      correlationId: meta.correlationId,
      version: 'v1',
      eventId: meta.eventId,
    }),
    payload,
  };
}
