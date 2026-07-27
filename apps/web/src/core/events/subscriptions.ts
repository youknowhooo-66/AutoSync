import { eventBus } from './eventBus';
import { handleServiceOrderCompleted, handleInvoicePaid } from './eventHandlers';
import { logger } from '@/utils/logger';

export function setupDomainSubscriptions() {
  eventBus.subscribe('os.completed', handleServiceOrderCompleted);
  eventBus.subscribe('invoice.paid', handleInvoicePaid);
  
  logger.audit.info('[Event Subscriptions] Domain event automation handlers registered.');
}
