import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { createAuditLog } from './AuditController';
import { logger } from "../shared/logger";

export const listSuppliers = async (req: AuthRequest, res: Response) => {
  try {
    const { search } = req.query;
    const suppliers = await prisma.supplier.findMany(({
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
        } as unknown as Parameters<typeof prisma.supplier.findMany>[0]));
    res.json(suppliers);
  } catch (error: unknown) {
    res.status(500).json({ message: 'Erro ao listar fornecedores.' });
  }
};

export const createSupplier = async (req: AuthRequest, res: Response) => {
  try {
    const { name, cnpj, phone, address, email } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Nome do fornecedor é obrigatório.' });
    }

    const supplier = await prisma.supplier.create(({
          data: { name, cnpj, phone, address, email },
        } as unknown as Parameters<typeof prisma.supplier.create>[0]));

    if (req.user) {
      await createAuditLog(req.user.id, 'CREATE', 'SUPPLIER', supplier.id, null, supplier, req.ip);
    }

    res.status(201).json({ message: 'Fornecedor cadastrado com sucesso.', supplier });
  } catch (error: unknown) {
  if (error instanceof Error) {
    if ((error as any).code === 'P2002') {
      return res.status(400).json({ message: 'CNPJ já cadastrado.' });
    }
    res.status(500).json({ message: 'Erro ao criar fornecedor.' });
  } else {
    logger.error({ err: error }, "An unknown error occurred");
      return res.status(500).json({ message: 'An unknown error occurred' });  }
}
};

export const updateSupplier = async (req: AuthRequest, res: Response) => {
  try {
    const id = (req.params.id as string) as string;
    const { name, cnpj, phone, address, email } = req.body;

    const oldSupplier = await prisma.supplier.findUnique({ where: { id } });

    const supplier = await prisma.supplier.update(({
          where: { id },
          data: { name, cnpj, phone, address, email },
        } as unknown as Parameters<typeof prisma.supplier.update>[0]));

    if (req.user) {
      await createAuditLog(req.user.id, 'UPDATE', 'SUPPLIER', id, oldSupplier, supplier, req.ip);
    }

    res.json({ message: 'Fornecedor atualizado com sucesso.', supplier });
  } catch (error: unknown) {
    res.status(500).json({ message: 'Erro ao atualizar fornecedor.' });
  }
};

export const deleteSupplier = async (req: AuthRequest, res: Response) => {
  try {
    const id = (req.params.id as string) as string;
    const oldSupplier = await prisma.supplier.findUnique({ where: { id } });

    await prisma.supplier.delete({ where: { id } });

    if (req.user) {
      await createAuditLog(req.user.id, 'DELETE', 'SUPPLIER', id, oldSupplier, null, req.ip);
    }

    res.json({ message: 'Fornecedor removido com sucesso.' });
  } catch (error: unknown) {
    res.status(500).json({ message: 'Erro ao remover fornecedor.' });
  }
};
