import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import { AppError } from '../errors/AppError';
import authConfig from '../config/auth';
import { prisma } from '../../config/prisma';

interface TokenPayload {
  sub: string;
  companyId: string;
  role: 'ADMIN' | 'USER' | 'VIEWER';
  branchId?: string;
}

export interface AuthRequest extends Request {
  user: {
    id: string;
    companyId: string;
    email?: string;
    role: 'ADMIN' | 'USER' | 'VIEWER';
    branchId?: string;
  };
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError('JWT token is missing', 401);
  }

  const [, token] = authHeader.split(' ');

  try {
    const { secret } = authConfig.jwt;
    const decoded = verify(token, secret) as TokenPayload;

    // Verify if user still exists in DB to prevent foreign key errors and handle deactivated users
    const user = await prisma.user.findUnique({ 
      where: { id: decoded.sub },
      select: { id: true, active: true, companyId: true, role: true, branchId: true }
    });
    
    if (!user || !user.active) {
      throw new AppError('User not found or inactive', 401);
    }

    req.user = {
      id: user.id,
      companyId: user.companyId,
      branchId: user.branchId || undefined,
      role: user.role as any,
    };

    req.companyId = user.companyId;

    return next();
  } catch (err: unknown) {
    if (err instanceof AppError) throw err;
    throw new AppError('Invalid JWT token', 401);
  }
}
