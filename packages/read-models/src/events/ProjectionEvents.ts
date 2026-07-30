import { DomainEvent } from '@autosync/domain';

/**
 * Event contracts for projection handlers awaiting domain implementation.
 * These are read-side expectations — no business rules, only payload shapes.
 */
export interface StockReleasedPayload {
  readonly stockItemId: string;
  readonly quantity: number;
  readonly workItemId: string;
}

export type StockReleasedV1 = DomainEvent<StockReleasedPayload>;

export interface AccountReceivableCreatedPayload {
  readonly accountId: string;
  readonly amount: number;
  readonly referenceId: string;
}

export type AccountReceivableCreatedV1 = DomainEvent<AccountReceivableCreatedPayload>;

export interface AccountPayableCreatedPayload {
  readonly accountId: string;
  readonly amount: number;
  readonly referenceId: string;
}

export type AccountPayableCreatedV1 = DomainEvent<AccountPayableCreatedPayload>;

export interface StockItemRegisteredPayload {
  readonly stockItemId: string;
  readonly sku: string;
  readonly description: string;
  readonly initialQuantity: number;
}

export type StockItemRegisteredV1 = DomainEvent<StockItemRegisteredPayload>;

import { buildEventMetadata } from '@autosync/domain';

export function createStockReleasedEvent(
  payload: StockReleasedPayload,
  meta: { companyId: string; correlationId: string; eventId?: string },
): StockReleasedV1 {
  return {
    ...buildEventMetadata({
      eventType: 'StockReleased',
      companyId: meta.companyId,
      correlationId: meta.correlationId,
      version: 'v1',
      eventId: meta.eventId,
    }),
    payload,
  };
}

export function createAccountReceivableCreatedEvent(
  payload: AccountReceivableCreatedPayload,
  meta: { companyId: string; correlationId: string; eventId?: string },
): AccountReceivableCreatedV1 {
  return {
    ...buildEventMetadata({
      eventType: 'AccountReceivableCreated',
      companyId: meta.companyId,
      correlationId: meta.correlationId,
      version: 'v1',
      eventId: meta.eventId,
    }),
    payload,
  };
}

export function createAccountPayableCreatedEvent(
  payload: AccountPayableCreatedPayload,
  meta: { companyId: string; correlationId: string; eventId?: string },
): AccountPayableCreatedV1 {
  return {
    ...buildEventMetadata({
      eventType: 'AccountPayableCreated',
      companyId: meta.companyId,
      correlationId: meta.correlationId,
      version: 'v1',
      eventId: meta.eventId,
    }),
    payload,
  };
}

export function createStockItemRegisteredEvent(
  payload: StockItemRegisteredPayload,
  meta: { companyId: string; correlationId: string; eventId?: string },
): StockItemRegisteredV1 {
  return {
    ...buildEventMetadata({
      eventType: 'StockItemRegistered',
      companyId: meta.companyId,
      correlationId: meta.correlationId,
      version: 'v1',
      eventId: meta.eventId,
    }),
    payload,
  };
}
