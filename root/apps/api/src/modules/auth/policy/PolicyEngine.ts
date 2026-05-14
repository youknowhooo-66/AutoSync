import { Role, Permission } from '../rbac/permissions';
import { rolePermissions } from '../rbac/rolePermissions.map';
import { logger } from '../../../shared/logger';
import { AuditLogService } from '../../../shared/audit/AuditLogService';

interface IUserContext {
  id: string;
  role: Role;
  companyId: string;
}

interface IPolicyContext {
  companyId?: string;
  correlationId?: string;
}

export class PolicyEngine {
  public static can(
    user: IUserContext, 
    permission: Permission, 
    context?: IPolicyContext
  ): boolean {
    const userPermissions = rolePermissions[user.role] || [];
    const hasPermission = userPermissions.includes(permission);

    // 1. Check Action-Based Permission
    if (!hasPermission) {
      this.logAuth(user, permission, 'AUTH_DENIED', 'Missing permission', context);
      return false;
    }

    // 2. Strict Multi-Tenant Enforcement
    if (context?.companyId && context.companyId !== user.companyId) {
      this.logAuth(user, permission, 'AUTH_DENIED', 'Cross-company access blocked', context);
      return false;
    }

    this.logAuth(user, permission, 'AUTH_SUCCESS', 'Access granted', context);
    return true;
  }

  private static logAuth(
    user: IUserContext, 
    permission: Permission, 
    action: 'AUTH_SUCCESS' | 'AUTH_DENIED',
    reason: string,
    context?: IPolicyContext
  ) {
    const logData = {
      userId: user.id,
      role: user.role,
      permission,
      companyId: user.companyId,
      correlationId: context?.correlationId,
      reason,
    };

    if (action === 'AUTH_DENIED') {
      logger.warn(`[PolicyEngine] Access Denied: ${reason}`, logData);
    } else {
      logger.info(`[PolicyEngine] Access Granted`, logData);
    }

    // Optionally record in Audit log for security trails
    AuditLogService.log({
      userId: user.id,
      companyId: user.companyId,
      action,
      resource: 'AUTH',
      resourceId: permission,
      newValue: logData,
    }).catch(err => logger.error(`[PolicyEngine] Failed to log audit: ${err.message}`));
  }
}
