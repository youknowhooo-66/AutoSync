import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import { AppError } from '../errors/AppError';

interface TokenPayload {
  sub: string;
  companyId: string;
  role: 'ADMIN' | 'USER' | 'VIEWER';
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError('JWT token is missing', 401);
  }

  const [, token] = authHeader.split(' ');

  try {
    const decoded = verify(token, process.env.JWT_SECRET || 'default-secret');

    const { sub, companyId, role } = decoded as TokenPayload;

    req.user = {
      id: sub,
      companyId,
      role,
    };

    req.companyId = companyId;

    return next();
  } catch (err) {
    throw new AppError('Invalid JWT token', 401);
  }
}
