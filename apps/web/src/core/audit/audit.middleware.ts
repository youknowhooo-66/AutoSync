import { eventBus } from '../events/eventBus';
import type { DomainEvent } from '../events/eventTypes';
import { AuditLog } from './auditLog';

export function setupAuditMiddleware() {
  // We subscribe a generic interceptor to the publish cycle,
  // or we can simply subscribe to a wildcard event if the eventBus supported it.
  // Since we have a typed list of events, we will register an auditor for all known types.
  
  const allEvents: DomainEvent['type'][] = [
    'os.created', 'os.updated', 'os.status_changed', 'os.completed',
    'stock.adjusted', 'stock.movement.created', 'stock.reserved', 'stock.released',
    'invoice.created', 'invoice.issued', 'invoice.paid', 'payment.received'
  ];

  allEvents.forEach(eventType => {
    eventBus.subscribe(eventType, (event: DomainEvent) => {
      
      const module = event.type.split('.')[0]; // 'os', 'stock', 'invoice', etc.
      
      AuditLog.create({
        tenantId: event.payload.tenantId,
        userId: event.payload.userId,
        action: `EVENT_${event.type.toUpperCase()}`,
        module,
        eventType: event.type,
        entityId: event.payload.data?.id,
        before: event.payload.data?.before,
        after: event.payload.data?.after,
      });
      
    });
  });

  console.log('[Audit Middleware] Active and listening to Domain Events.');
}
