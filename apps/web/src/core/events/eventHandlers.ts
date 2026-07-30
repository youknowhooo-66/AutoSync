import type { DomainEvent } from './eventTypes';
import { publishDomainEvent } from './domainEvents';
import { logger } from '@/utils/logger';

export const handleServiceOrderCompleted = async (event: DomainEvent) => {
  const osData = event.payload.data;
  
  // Rule: OS completed -> Emit Invoice created
  logger.audit.debug('[Domain Automation] OS Completed detected. Generating Draft Invoice...');
  
  publishDomainEvent('invoice.created', {
    tenantId: event.payload.tenantId,
    userId: event.payload.userId,
    roleContext: 'SYSTEM_AUTOMATION',
    timestamp: new Date().toISOString(),
    data: {
      sourceOSId: osData.id,
      amount: osData.finalValue,
      status: 'DRAFT',
      client: osData.client
    }
  });
};

export const handleInvoicePaid = async (event: DomainEvent) => {
  const invoiceData = event.payload.data;
  
  // Rule: Invoice paid -> Stock deduction
  logger.audit.debug('[Domain Automation] Invoice Paid detected. Emitting Stock Movements...');
  
  if (invoiceData.parts && invoiceData.parts.length > 0) {
    invoiceData.parts.forEach((part: any) => {
      publishDomainEvent('stock.movement.created', {
        tenantId: event.payload.tenantId,
        userId: event.payload.userId,
        roleContext: 'SYSTEM_AUTOMATION',
        timestamp: new Date().toISOString(),
        data: {
          partId: part.id,
          type: 'OUT',
          quantity: part.quantity,
          source: 'OS_PAID',
          referenceId: invoiceData.id
        }
      });
    });
  }
};
