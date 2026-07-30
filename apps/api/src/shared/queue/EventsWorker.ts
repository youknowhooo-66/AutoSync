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
    const { name, correlationId, id: eventId } = event as any;

    try {
      logger.info({ correlationId, eventId }, `[EventsWorker] Zero Trust Validation for event: ${name}`);

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
          logger.warn({ correlationId }, `[EventsWorker] No handler registered or unauthorized event: ${name}`);
      }
    } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error({ correlationId, eventId, eventName: name, stack: (error instanceof Error ? (error instanceof Error ? error.stack : undefined) : undefined) }, `[Security:EventsWorker] SECURE_EXECUTION_FAILED: ${(error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error))}`);
      if ((error as any).statusCode === 403 || (error as any).statusCode === 409) {
          return; 
        }
      throw error;
    } else {
      logger.error({ err: error }, "An unknown error occurred");
    }
  }
  });

  logger.info('[EventsWorker] Zero Trust secure worker initialized.');
}

initializeEventsWorker();
