import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';

export interface AuthRequest extends Request {
  user: {
    id: string;
    companyId: string;
    email: string;
    role: string;
    branchId?: string | null;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token de autenticação não fornecido.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    
    // Verify if user still exists in DB to prevent foreign key errors
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    
    if (!user || !user.active) {
      res.status(401).json({ message: 'Usuário não encontrado ou inativo.' });
      return;
    }

    req.user = {
      id: user.id,
      companyId: user.companyId,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    };
    next();
  } catch (error: unknown) {
    res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Acesso negado. Permissão insuficiente.' });
      return;
    }
    next();
  };
};
