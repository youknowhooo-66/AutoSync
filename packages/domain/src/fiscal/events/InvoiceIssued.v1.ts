import { DomainEvent, buildEventMetadata } from '../../shared/DomainEvent';

export interface InvoiceIssuedPayload {
  readonly invoiceId: string;
  readonly type: 'nfe' | 'nfse';
  readonly referenceId: string;
}

export type InvoiceIssuedV1 = DomainEvent<InvoiceIssuedPayload>;

export function createInvoiceIssuedEvent(
  payload: InvoiceIssuedPayload,
  meta: { companyId: string; correlationId: string; eventId?: string },
): InvoiceIssuedV1 {
  return {
    ...buildEventMetadata({
      eventType: 'InvoiceIssued',
      companyId: meta.companyId,
      correlationId: meta.correlationId,
      version: 'v1',
      eventId: meta.eventId,
    }),
    payload,
  };
}
