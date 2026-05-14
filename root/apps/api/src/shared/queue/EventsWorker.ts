import { QueueProvider } from './QueueProvider';
import { logger } from '../logger';
import { StockWorker } from '../../modules/serviceOrders/workers/StockWorker';
import { FinancialWorker } from '../../modules/serviceOrders/workers/FinancialWorker';
import { AuditWorker } from '../../modules/serviceOrders/workers/AuditWorker';
import { WorkerGuard } from '../security/validation/WorkerGuard';
import { Permission } from '../../modules/auth/rbac/permissions';
import { ISecureEvent } from '../events/SecureEvent';

export function initializeEventsWorker() {
  QueueProvider.createWorker('events_queue', async (job) => {
    const event = job.data as ISecureEvent;
    const { name, correlationId, id: eventId } = event;

    try {
      logger.info(`[EventsWorker] Zero Trust Validation for event: ${name}`, { correlationId, eventId });

      switch (name) {
        case 'SERVICE_ORDER_COMPLETED':
          // 1. Mandatory Worker Validation
          await WorkerGuard.validate(event, Permission.SERVICE_ORDER_COMPLETE);

          // 2. Execution of side effects
          await Promise.all([
            StockWorker.handleOSCompleted(event.payload),
            FinancialWorker.handleOSCompleted(event.payload),
            AuditWorker.handleEvent(event.payload, name),
          ]);
          break;

        case 'SERVICE_ORDER_CREATED':
          await WorkerGuard.validate(event, Permission.SERVICE_ORDER_CREATE);
          await AuditWorker.handleEvent(event.payload, name);
          break;

        case 'SERVICE_ORDER_CANCELED':
          await WorkerGuard.validate(event, Permission.SERVICE_ORDER_CANCEL);
          await AuditWorker.handleEvent(event.payload, name);
          break;

        default:
          logger.warn(`[EventsWorker] No handler registered or unauthorized event: ${name}`, { correlationId });
      }
    } catch (error) {
      logger.error(`[Security:EventsWorker] SECURE_EXECUTION_FAILED: ${error.message}`, { 
        correlationId, 
        eventId, 
        eventName: name,
        stack: error.stack 
      });
      // Do not retry if it's a security violation (Unauthorized/Tenant violation)
      if (error.statusCode === 403 || error.statusCode === 409) {
        return; 
      }
      throw error; // Retry for operational errors
    }
  });

  logger.info('[EventsWorker] Zero Trust secure worker initialized.');
}
