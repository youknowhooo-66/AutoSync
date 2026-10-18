import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

/**
 * The tenant comes only from the authenticated user (JWT + database), never from
 * the request body. Rejecting these keys up front stops mass assignment of the
 * tenant on every route, including handlers that spread `req.body`.
 */
const TENANT_FIELDS = ['companyId', 'tenantId'] as const;

export function rejectTenantFields(req: Request, _res: Response, next: NextFunction) {
  const body: unknown = req.body;
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const present = TENANT_FIELDS.filter((field) => Object.prototype.hasOwnProperty.call(body, field));
    if (present.length > 0) {
      throw new AppError('Tenant fields are not accepted in the request body.', 400, 'TENANT_FIELD_NOT_ALLOWED', present.map((path) => ({
        path,
        message: `${path} is derived from the authenticated user`,
      })));
    }
  }
  next();
}
