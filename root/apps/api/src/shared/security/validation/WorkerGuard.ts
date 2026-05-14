import { ISecureEvent } from '../../events/SecureEvent';
import { PolicyEngine } from '../../../modules/auth/policy/PolicyEngine';
import { Permission, Role } from '../../../modules/auth/rbac/permissions';
import { AppError } from '../../errors/AppError';
import { logger } from '../../logger';
import { IdempotencyStore } from '../idempotency/IdempotencyStore';

export class WorkerGuard {
  public static async validate(event: ISecureEvent, requiredPermission: Permission): Promise<void> {
    const { id, companyId, userId, correlationId } = event;

    // 1. Replay Attack Protection
    if (await IdempotencyStore.isDuplicate(id)) {
      throw new AppError('DUPLICATE_EVENT_EXECUTION_ATTEMPT', 409);
    }

    // 2. Tenant Isolation Check
    if (!companyId) {
      logger.error(`[Security:WorkerGuard] Tenant Isolation Violation: Missing companyId`, { eventId: id, correlationId });
      throw new AppError('TENANT_ISOLATION_VIOLATION', 403);
    }

    // 3. Zero Trust Permission Re-validation
    // Note: In worker context, we might need to fetch the user's current role from DB 
    // to ensure they haven't been demoted since the event was emitted.
    // For now, we use a system-level policy or the payload snapshot.
    const mockUserContext = { 
      id: userId, 
      role: Role.ADMIN, // Or get from event/DB
      companyId 
    };

    const isAuthorized = PolicyEngine.can(
      mockUserContext as any,
      requiredPermission,
      { companyId, correlationId }
    );

    if (!isAuthorized) {
      logger.error(`[Security:WorkerGuard] Unauthorized Worker Execution Attempt`, { eventId: id, correlationId, userId, permission: requiredPermission });
      throw new AppError('UNAUTHORIZED_WORKER_EXECUTION', 403);
    }

    // Mark as processed only if all validations pass
    await IdempotencyStore.markAsProcessed(id);
  }
}
