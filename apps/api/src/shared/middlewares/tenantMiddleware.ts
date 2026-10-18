import { Request, Response, NextFunction } from 'express';

/**
 * The tenant comes only from the JWT, resolved in authMiddleware. Client headers
 * such as x-company-id / x-tenant-id are deliberately ignored, and x-branch-id is
 * only honoured after authMiddleware validates it against the database.
 */
export const tenantMiddleware = (_req: Request, _res: Response, next: NextFunction) => {
  next();
};
