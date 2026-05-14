import { AuditLogService } from '../../../shared/audit/AuditLogService';
import { logger } from '../../../shared/logger';

export const AuditWorker = {
  async handleEvent(payload: any, eventName: string) {
    const { orderId, companyId, userId, correlationId } = payload;

    logger.info(`[AuditWorker] Recording audit trail for ${eventName}...`, { correlationId });

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

      logger.info(`[AuditWorker] Audit trail for OS ${orderId} saved.`, { correlationId });
    } catch (error) {
      logger.error(`[AuditWorker] Failed to save audit log for ${eventName}: ${error.message}`, { correlationId, error });
      // We don't necessarily want to retry audit failures if they are non-critical,
      // but for "production level", audit should be reliable.
      throw error;
    }
  }
};
