import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import { AppError } from '../errors/AppError';
import authConfig from '../config/auth';

interface TokenPayload {
  sub: string;
  companyId: string;
  role: 'ADMIN' | 'USER' | 'VIEWER';
  branchId?: string;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError('JWT token is missing', 401);
  }

  const [, token] = authHeader.split(' ');

  try {
    const { secret } = authConfig.jwt;
    const decoded = verify(token, secret) as TokenPayload;

    req.user = {
      id: decoded.sub,
      companyId: decoded.companyId,
      branchId: decoded.branchId,
      role: decoded.role,
    };

    req.companyId = decoded.companyId;

    return next();
  } catch (err: unknown) {
    throw new AppError('Invalid JWT token', 401);
  }
}
