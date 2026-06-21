import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../shared/middlewares/authMiddleware';
import { createAuditLog } from './AuditController';
import { logger } from "../shared/logger";

export const listUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { branchId } = req.query;
    const users = await prisma.user.findMany({
          where: {
            companyId: req.user.companyId,
            ...(branchId ? { branchId: String(branchId) } : {})
          },
          include: { branch: true },
          orderBy: { name: 'asc' }
        });
    res.json(users);
  } catch (error: unknown) {
    res.status(500).json({ message: 'Erro ao listar usuários.' });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role, branchId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Nome, e-mail, senha e cargo são obrigatórios.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (branchId) {
      const branch = await prisma.branch.findFirst({ where: { id: branchId, companyId: req.user.companyId } });
      if (!branch) return res.status(400).json({ message: 'Filial inválida para esta empresa.' });
    }

    const user = await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role,
            branchId,
            companyId: req.user.companyId
          }
        });

    if (req.user) {
      const { password: _, ...logData } = user;
      await createAuditLog(req.user.id, 'CREATE', 'USER', user.id, null, logData, req.ip);
    }

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({ message: 'Usuário cadastrado com sucesso.', user: userWithoutPassword });
  } catch (error: unknown) {
  if (error instanceof Error) {
    if ((error as any).code === 'P2002') {
      return res.status(400).json({ message: 'Este e-mail já está em uso.' });
    }
    res.status(500).json({ message: 'Erro ao criar usuário.' });
  } else {
    logger.error({ err: error }, "An unknown error occurred");
      return res.status(500).json({ message: 'An unknown error occurred' });  }
}
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const id = (req.params.id as string) as string;
    const { name, email, role, branchId, active } = req.body;

    const oldUser = await prisma.user.findFirst({ where: { id, companyId: req.user.companyId } });
    if (!oldUser) return res.status(404).json({ message: 'Usuário não encontrado.' });

    if (branchId) {
      const branch = await prisma.branch.findFirst({ where: { id: branchId, companyId: req.user.companyId } });
      if (!branch) return res.status(400).json({ message: 'Filial inválida para esta empresa.' });
    }

    const user = await prisma.user.update({
          where: { id },
          data: { name, email, role, branchId, active }
        });

    if (req.user) {
      const { password: __, ...oldLogData } = oldUser || {};
      const { password: _, ...newLogData } = user;
      await createAuditLog(req.user.id, 'UPDATE', 'USER', id, oldLogData, newLogData, req.ip);
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ message: 'Usuário atualizado com sucesso.', user: userWithoutPassword });
  } catch (error: unknown) {
    res.status(500).json({ message: 'Erro ao atualizar usuário.' });
  }
};
