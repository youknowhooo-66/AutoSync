import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

// Extending Express Request to include companyId
declare global {
  namespace Express {
    interface Request {
      companyId: string;
      userId: string;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authToken = req.headers.authorization;

  if (!authToken) {
    throw new AppError('Token missing', 401);
  }

  const [, token] = authToken.split(' ');

  try {
    // In a real application, you would verify the JWT here.
    // For this architecture implementation, we mock the extraction.
    // Replace this with: const decoded = verify(token, secret);
    
    // MOCK: Assuming JWT payload contains companyId and userId
    req.companyId = 'mock-company-id'; 
    req.userId = 'mock-user-id';

    next();
  } catch (err) {
    throw new AppError('Invalid token', 401);
  }
}
