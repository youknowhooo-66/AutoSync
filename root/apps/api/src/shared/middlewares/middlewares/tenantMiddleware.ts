import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

export const tenantMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const branchId = req.headers['x-branch-id'];

  if (!branchId) {
    // If it's a public route or login, we might not have a branchId yet.
    // But for most protected routes, we need it.
    // We can also get it from the user's token later in the auth middleware.
    return next();
  }

  req.branchId = branchId as string;
  next();
};
