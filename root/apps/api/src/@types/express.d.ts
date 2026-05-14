import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        companyId: string;
        role: 'ADMIN' | 'USER' | 'VIEWER';
      };
      companyId: string;
    }
  }
}
