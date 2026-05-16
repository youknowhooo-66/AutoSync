import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { createAuditLog } from './AuditController';
import { logger } from "../shared/logger";

export const listBranches = async (req: AuthRequest, res: Response) => {
  try {
    const branches = await prisma.branch.findMany(({
          orderBy: { createdAt: 'desc' }
        } as unknown as Parameters<typeof prisma.branch.findMany>[0]));
    res.json(branches);
  } catch (error: unknown) {
    res.status(500).json({ message: 'Erro ao listar filiais.' });
  }
};

export const createBranch = async (req: AuthRequest, res: Response) => {
  try {
    const { name, cnpj, address, phone, email } = req.body;

    if (!name || !cnpj) {
      return res.status(400).json({ message: 'Nome e CNPJ são obrigatórios.' });
    }

    const branch = await prisma.branch.create(({
          data: { name, cnpj, address, phone, email }
        } as unknown as Parameters<typeof prisma.branch.create>[0]));

    if (req.user) {
      await createAuditLog(req.user.id, 'CREATE', 'BRANCH', branch.id, null, branch, req.ip);
    }

    res.status(201).json({ message: 'Filial cadastrada com sucesso.', branch });
  } catch (error: unknown) {
  if (error instanceof Error) {
    if ((error as any).code === 'P2002') {
      return res.status(400).json({ message: 'Este CNPJ já está cadastrado.' });
    }
    res.status(500).json({ message: 'Erro ao criar filial.' });
  } else {
    logger.error({ err: error }, "An unknown error occurred");
      return res.status(500).json({ message: 'An unknown error occurred' });  }
}
};

export const updateBranch = async (req: AuthRequest, res: Response) => {
  try {
    const id = (req.params.id as string) as string;
    const { name, cnpj, address, phone, email, active } = req.body;

    const oldBranch = await prisma.branch.findUnique({ where: { id } });

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (cnpj !== undefined) updateData.cnpj = cnpj;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (active !== undefined) updateData.active = active;

    const branch = await prisma.branch.update({
      where: { id },
      data: updateData
    });

    if (req.user) {
      await createAuditLog(req.user.id, 'UPDATE', 'BRANCH', id, oldBranch, branch, req.ip);
    }

    res.json({ message: 'Filial atualizada com sucesso.', branch });
  } catch (error: unknown) {
  if (error instanceof Error) {
    if ((error as any).code === 'P2002') {
      return res.status(400).json({ message: 'Este CNPJ já pertence a outra filial.' });
    }
    res.status(500).json({ message: 'Erro ao atualizar filial.' });
  } else {
    logger.error({ err: error }, "An unknown error occurred");
      return res.status(500).json({ message: 'An unknown error occurred' });  }
}
};
