import { AuditLogService } from '../../../shared/audit/AuditLogService';
import { logger } from '../../../shared/logger';

export const AuditWorker = {
  async handleEvent(payload: any, eventName: string) {
    const { orderId, companyId, userId, correlationId } = payload;

    logger.info({ correlationId }, `[AuditWorker] Recording audit trail for ${eventName}...`);

    try {
      await AuditLogService.log({
        userId,
        companyId,
        action: eventName,
        resource: 'SERVICE_ORDER',
        resourceId: orderId,
        oldValue: payload.oldValue || {},
        newValue: payload.newValue || payload, // Log entire payload if no specific newValue
      });

      logger.info({ correlationId }, `[AuditWorker] Audit trail for OS ${orderId} saved.`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error({ correlationId, err: error }, `[AuditWorker] Failed to save audit log for ${eventName}: ${(error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error))}`);
        throw error;
      } else {
        logger.error({ err: error }, "An unknown error occurred");
      }
    }
  }
};
