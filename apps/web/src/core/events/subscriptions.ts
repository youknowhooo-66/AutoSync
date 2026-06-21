import { eventBus } from './eventBus';
import { handleServiceOrderCompleted, handleInvoicePaid } from './eventHandlers';

export function setupDomainSubscriptions() {
  eventBus.subscribe('os.completed', handleServiceOrderCompleted);
  eventBus.subscribe('invoice.paid', handleInvoicePaid);
  
  console.log('[Event Subscriptions] Domain event automation handlers registered.');
}
