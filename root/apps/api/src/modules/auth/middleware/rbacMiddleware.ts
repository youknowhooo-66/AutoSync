import { Request, Response, NextFunction } from 'express';
import { Permission } from '../rbac/permissions';
import { PolicyEngine } from '../policy/PolicyEngine';
import { AppError } from '../../../shared/errors/AppError';

export function rbacMiddleware(requiredPermission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    const { companyId } = req.body; // or req.query depending on endpoint

    if (!user) {
      throw new AppError('Unauthenticated', 401);
    }

    // Context for policy check
    const context = {
      companyId: companyId || user.companyId,
      correlationId: req.headers['x-correlation-id'] as string,
    };

    const isAuthorized = PolicyEngine.can(
      { id: user.id, role: user.role as any, companyId: user.companyId },
      requiredPermission,
      context
    );

    if (!isAuthorized) {
      throw new AppError('Forbidden: Insufficient permissions', 403);
    }

    next();
  };
}
