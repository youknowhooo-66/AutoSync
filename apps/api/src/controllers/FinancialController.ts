import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { createAuditLog } from './AuditController';

export const listFinancialRecords = async (req: AuthRequest, res: Response) => {
  try {
    const { branchId, type, status } = req.query;
    const records = await prisma.financialRecord.findMany(({
          where: {
            branchId: branchId ? String(branchId) : undefined,
            type: type ? (type as any) : undefined,
            status: status ? (status as any) : undefined
          },
          orderBy: { dueDate: 'asc' }
        } as unknown as Parameters<typeof prisma.financialRecord.findMany>[0]));
    res.json(records);
  } catch (error: unknown) {
    res.status(500).json({ message: 'Erro ao listar registros financeiros.' });
  }
};

export const createFinancialRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { branchId, type, category, description, amount, dueDate } = req.body;

    const record = await prisma.financialRecord.create(({
          data: {
            branchId,
            type,
            category,
            description,
            amount,
            dueDate: new Date(dueDate),
            status: 'PENDING'
          }
        } as unknown as Parameters<typeof prisma.financialRecord.create>[0]));

    if (req.user) {
      await createAuditLog(req.user.id, 'CREATE', 'FINANCIAL', record.id, null, record, req.ip);
    }

    res.status(201).json({ message: 'Registro financeiro criado com sucesso.', record });
  } catch (error: unknown) {
    res.status(500).json({ message: 'Erro ao criar registro financeiro.' });
  }
};

export const payRecord = async (req: AuthRequest, res: Response) => {
  try {
    const id = (req.params.id as string) as string;
    const { paymentDate } = req.body;

    const oldRecord = await prisma.financialRecord.findUnique({ where: { id } });

    const record = await prisma.financialRecord.update(({
          where: { id },
          data: {
            status: 'PAID',
            paymentDate: paymentDate ? new Date(paymentDate) : new Date()
          }
        } as unknown as Parameters<typeof prisma.financialRecord.update>[0]));

    if (req.user) {
      await createAuditLog(req.user.id, 'UPDATE_STATUS', 'FINANCIAL', id, oldRecord?.status, 'PAID', req.ip);
    }

    res.json({ message: 'Pagamento registrado com sucesso.', record });
  } catch (error: unknown) {
    res.status(500).json({ message: 'Erro ao registrar pagamento.' });
  }
};
