import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

export function ensureRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { user } = req;

    if (!user) {
      throw new AppError('User not authenticated', 401);
    }

    if (!roles.includes(user.role)) {
      throw new AppError('Permission denied', 403);
    }

    return next();
  };
}
