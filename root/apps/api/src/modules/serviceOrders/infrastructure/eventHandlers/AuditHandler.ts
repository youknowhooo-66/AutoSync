import { AuditLogService } from '../../../../shared/audit/AuditLogService';
import { eventBus } from '../../application/eventBus/EventBus';

export function setupAuditHandler() {
  eventBus.on('SERVICE_ORDER_COMPLETED', async (payload) => {
    const { orderId, companyId, userId } = payload;

    await AuditLogService.log({
      userId,
      companyId,
      action: 'OS_COMPLETED',
      resource: 'SERVICE_ORDER',
      resourceId: orderId,
      oldValue: { status: 'IN_PROGRESS' },
      newValue: { status: 'COMPLETED' },
    });
  });
}
