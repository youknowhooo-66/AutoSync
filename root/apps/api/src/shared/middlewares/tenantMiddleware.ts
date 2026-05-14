import { Request, Response, NextFunction } from 'express';

export const tenantMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const companyId = req.headers['x-company-id'];
  const branchId = req.headers['x-branch-id'];

  if (companyId) {
    req.companyId = companyId as string;
  }

  if (branchId) {
    req.branchId = branchId as string;
  }

  next();
};
