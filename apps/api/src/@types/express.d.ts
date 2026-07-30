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
      /** Correlation ID propagated via x-correlation-id header. Always present after correlationIdMiddleware. */
      correlationId: string;
    }
  }
}
