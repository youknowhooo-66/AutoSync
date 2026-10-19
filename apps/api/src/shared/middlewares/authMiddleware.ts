import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import { AppError } from '../errors/AppError';
import authConfig from '../config/auth';
import { prismaClient as prisma } from '../database/prismaClient';
import { readSessionCookie } from '../http/sessionCookie';

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
  // Browsers send the httpOnly session cookie; scripts and tests may still use a Bearer header.
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : readSessionCookie(req);

  if (!token) {
    throw new AppError('JWT token is missing', 401);
  }

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
    req.branchId = await resolveBranch(req.headers['x-branch-id'], user);

    return next();
  } catch (err: unknown) {
    if (err instanceof AppError) throw err;
    throw new AppError('Invalid JWT token', 401);
  }
}

/**
 * x-branch-id is a UI preference, never an authority. A branch from another company
 * is rejected; a user bound to a branch always works in that branch, whatever the
 * header says. Only users without a fixed branch (e.g. ADMIN) can switch.
 */
async function resolveBranch(
  header: string | string[] | undefined,
  user: { companyId: string; branchId: string | null; role: string },
): Promise<string | undefined> {
  const requested = Array.isArray(header) ? header[0] : header;

  if (user.role !== 'ADMIN' && user.branchId) {
    return user.branchId;
  }
  if (!requested) {
    return user.branchId ?? undefined;
  }

  const branch = await prisma.branch.findFirst({
    where: { id: requested, companyId: user.companyId },
    select: { id: true },
  });
  if (!branch) {
    throw new AppError('Branch not available for this user', 403, 'BRANCH_FORBIDDEN');
  }
  return branch.id;
}
