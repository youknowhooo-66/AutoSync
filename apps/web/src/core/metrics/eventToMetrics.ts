import { eventBus } from '../events/eventBus';
import type { DomainEvent } from '../events/eventTypes';
import { metricsAggregator } from './metricsAggregator';

export function mapEventToMetrics(event: DomainEvent) {
  const { tenantId, data } = event.payload;
  if (!tenantId) return;

  switch (event.type) {
    case 'os.created':
      metricsAggregator.incrementCounter(tenantId, 'osCreated');
      break;
      
    case 'os.completed':
      metricsAggregator.incrementCounter(tenantId, 'osCompleted');
      // Assume OS data has createdAt and updatedAt or completedAt
      if (data.createdAt && data.completedAt) {
        const start = new Date(data.createdAt).getTime();
        const end = new Date(data.completedAt).getTime();
        metricsAggregator.addCompletionTime(tenantId, end - start);
      }
      break;

    case 'os.status_changed':
      if (data.status === 'CANCELED') {
        metricsAggregator.incrementCounter(tenantId, 'osCanceled');
      }
      break;

    case 'invoice.created':
      metricsAggregator.incrementCounter(tenantId, 'invoiceCreatedCount');
      break;

    case 'invoice.paid':
    case 'payment.received':
      // Prevent double counting if both are emitted. Usually we count revenue on payment.
      if (event.type === 'invoice.paid') {
        metricsAggregator.incrementCounter(tenantId, 'invoicePaidCount');
        if (data.amount) {
          metricsAggregator.addRevenue(tenantId, Number(data.amount));
        }
      }
      break;

    case 'stock.movement.created':
      metricsAggregator.incrementCounter(tenantId, 'stockMovements');
      break;
  }
}
