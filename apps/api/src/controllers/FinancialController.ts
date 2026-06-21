import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../shared/middlewares/authMiddleware';
import { createAuditLog } from './AuditController';

export const listFinancialRecords = async (req: AuthRequest, res: Response) => {
  try {
    const { branchId, type, status } = req.query;
    const where: any = {
      companyId: req.user.companyId,
      ...(branchId ? { branchId: String(branchId) } : {}),
      ...(type ? { type: type as any } : {}),
      ...(status ? { status: status as any } : {})
    };

    const records = await prisma.financialRecord.findMany({
      where,
      orderBy: { dueDate: 'asc' }
    });
    res.json(records);
  } catch (error: unknown) {
    res.status(500).json({ message: 'Erro ao listar registros financeiros.' });
  }
};

export const createFinancialRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { branchId, type, category, description, amount, dueDate } = req.body;

    const branch = await prisma.branch.findFirst({ where: { id: branchId, companyId: req.user.companyId } });
    if (!branch) {
      return res.status(400).json({ message: 'Filial inválida para esta empresa.' });
    }

    const record = await prisma.financialRecord.create({
      data: {
        branchId,
        companyId: req.user.companyId,
        type,
        category,
        description,
        amount,
        dueDate: new Date(dueDate),
        status: 'PENDING'
      }
    });

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

    const oldRecord = await prisma.financialRecord.findFirst({ where: { id, companyId: req.user.companyId } });
    if (!oldRecord) {
      return res.status(404).json({ message: 'Registro financeiro não encontrado.' });
    }

    const record = await prisma.financialRecord.update({
      where: { id },
      data: {
        status: 'PAID',
        paymentDate: paymentDate ? new Date(paymentDate) : new Date()
      }
    });

    if (req.user) {
      await createAuditLog(req.user.id, 'UPDATE_STATUS', 'FINANCIAL', id, oldRecord.status, 'PAID', req.ip);
    }

    res.json({ message: 'Pagamento registrado com sucesso.', record });
  } catch (error: unknown) {
    res.status(500).json({ message: 'Erro ao registrar pagamento.' });
  }
};
