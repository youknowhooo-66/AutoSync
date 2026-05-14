import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { createAuditLog } from './AuditController';

export const listSuppliers = async (req: AuthRequest, res: Response) => {
  try {
    const { search } = req.query;
    const suppliers = await prisma.supplier.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: String(search), mode: 'insensitive' } },
              { cnpj: { contains: String(search) } },
            ],
          }
        : {},
      include: { parts: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar fornecedores.' });
  }
};

export const createSupplier = async (req: AuthRequest, res: Response) => {
  try {
    const { name, cnpj, phone, address, email } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Nome do fornecedor é obrigatório.' });
    }

    const supplier = await prisma.supplier.create({
      data: { name, cnpj, phone, address, email },
    });

    if (req.user) {
      await createAuditLog(req.user.id, 'CREATE', 'SUPPLIER', supplier.id, null, supplier, req.ip);
    }

    res.status(201).json({ message: 'Fornecedor cadastrado com sucesso.', supplier });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'CNPJ já cadastrado.' });
    }
    res.status(500).json({ message: 'Erro ao criar fornecedor.' });
  }
};

export const updateSupplier = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, cnpj, phone, address, email } = req.body;

    const oldSupplier = await prisma.supplier.findUnique({ where: { id } });

    const supplier = await prisma.supplier.update({
      where: { id },
      data: { name, cnpj, phone, address, email },
    });

    if (req.user) {
      await createAuditLog(req.user.id, 'UPDATE', 'SUPPLIER', id, oldSupplier, supplier, req.ip);
    }

    res.json({ message: 'Fornecedor atualizado com sucesso.', supplier });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar fornecedor.' });
  }
};

export const deleteSupplier = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const oldSupplier = await prisma.supplier.findUnique({ where: { id } });

    await prisma.supplier.delete({ where: { id } });

    if (req.user) {
      await createAuditLog(req.user.id, 'DELETE', 'SUPPLIER', id, oldSupplier, null, req.ip);
    }

    res.json({ message: 'Fornecedor removido com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover fornecedor.' });
  }
};
