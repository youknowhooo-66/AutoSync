import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../errors/AppError';

interface TokenPayload {
  iat: number;
  exp: number;
  sub: string;
  branchId: string;
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError('JWT token is missing', 401);
  }

  const [, token] = authHeader.split(' ');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default');

    const { sub, branchId } = decoded as TokenPayload;

    req.user = {
      id: sub,
    };

    // If tenantMiddleware didn't find a branchId in headers, 
    // we use the one from the token
    if (!req.branchId) {
      req.branchId = branchId;
    }

    return next();
  } catch {
    throw new AppError('Invalid JWT token', 401);
  }
};
