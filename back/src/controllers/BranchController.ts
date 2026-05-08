import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { createAuditLog } from './AuditController';

export const listBranches = async (req: AuthRequest, res: Response) => {
  try {
    const branches = await prisma.branch.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(branches);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar filiais.' });
  }
};

export const createBranch = async (req: AuthRequest, res: Response) => {
  try {
    const { name, cnpj, address, phone, email } = req.body;

    if (!name || !cnpj) {
      return res.status(400).json({ message: 'Nome e CNPJ são obrigatórios.' });
    }

    const branch = await prisma.branch.create({
      data: { name, cnpj, address, phone, email }
    });

    if (req.user) {
      await createAuditLog(req.user.id, 'CREATE', 'BRANCH', branch.id, null, branch, req.ip);
    }

    res.status(201).json({ message: 'Filial cadastrada com sucesso.', branch });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Este CNPJ já está cadastrado.' });
    }
    res.status(500).json({ message: 'Erro ao criar filial.' });
  }
};

export const updateBranch = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, cnpj, address, phone, email, active } = req.body;

    const oldBranch = await prisma.branch.findUnique({ where: { id } });

    const branch = await prisma.branch.update({
      where: { id },
      data: { 
        name, 
        cnpj, 
        address, 
        phone, 
        email, 
        active 
      }
    });

    if (req.user) {
      await createAuditLog(req.user.id, 'UPDATE', 'BRANCH', id, oldBranch, branch, req.ip);
    }

    res.json({ message: 'Filial atualizada com sucesso.', branch });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Este CNPJ já pertence a outra filial.' });
    }
    res.status(500).json({ message: 'Erro ao atualizar filial.' });
  }
};
