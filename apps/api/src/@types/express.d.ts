import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        companyId: string;
        role: string;
        branchId?: string | null;
      };
      companyId: string;
      branchId?: string | null;
    }
  }
}
