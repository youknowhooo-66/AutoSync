import { Response } from 'express';
import { prisma } from '../config/prisma';
import { logger } from "../shared/logger";
import { AuthRequest } from '../shared/middlewares/authMiddleware';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user.companyId;
    const { branchId } = req.query;

    if (branchId) {
      const branch = await prisma.branch.findFirst({ where: { id: String(branchId), companyId } });
      if (!branch) {
        return res.status(400).json({ message: 'Filial inválida para esta empresa.' });
      }
    }

    const where: any = {
      companyId,
      ...(branchId ? { branchId: String(branchId) } : {})
    };

    // --- Funnel data ---
    // OS Created (total)
    const osCreated = await prisma.serviceOrder.count({ where });

    // OS Completed (FINISHED)
    const osCompleted = await prisma.serviceOrder.count({
      where: { ...where, status: 'FINISHED' }
    });

    // OS Cancelled
    const osCancelled = await prisma.serviceOrder.count({
      where: { ...where, status: 'CANCELLED' }
    });

    // Invoiced (FinancialRecords of type RECEIVABLE created for this company)
    const invoiced = await prisma.financialRecord.count({
      where: {
        companyId,
        type: 'RECEIVABLE',
        ...(branchId ? { branchId: String(branchId) } : {}),
      }
    });

    // Paid invoices
    const paid = await prisma.financialRecord.count({
      where: {
        companyId,
        type: 'RECEIVABLE',
        status: 'PAID',
        ...(branchId ? { branchId: String(branchId) } : {}),
      }
    });

    // --- Revenue ---
    const revenueSummary = await prisma.financialRecord.aggregate({
      where: {
        companyId,
        type: 'RECEIVABLE',
        status: 'PAID',
        ...(branchId ? { branchId: String(branchId) } : {}),
      },
      _sum: { amount: true }
    });
    const totalRevenue = Number(revenueSummary._sum.amount || 0);

    // --- Avg Completion Time ---
    // Get all finished OS with both createdAt and updatedAt to approximate completion time
    const finishedOrders = await prisma.serviceOrder.findMany({
      where: { ...where, status: 'FINISHED' },
      select: { createdAt: true, updatedAt: true }
    });

    let avgCompletionTimeHours = 0;
    if (finishedOrders.length > 0) {
      const totalMs = finishedOrders.reduce((acc, os) => {
        return acc + (os.updatedAt.getTime() - os.createdAt.getTime());
      }, 0);
      avgCompletionTimeHours = totalMs / finishedOrders.length / (1000 * 60 * 60);
    }

    // --- Conversion Rate (OS Created -> Paid Invoice) ---
    const conversionRate = osCreated > 0 ? (paid / osCreated) * 100 : 0;

    // --- Cancellation Rate ---
    const cancellationRate = osCreated > 0 ? (osCancelled / osCreated) * 100 : 0;

    // --- Stock Movements ---
    const stockMovements = await prisma.inventoryMovement.count({
      where: {
        part: { companyId },
        ...(branchId ? { branchId: String(branchId) } : {}),
      }
    });

    // --- Health Evaluation ---
    const backlog = osCreated - (osCompleted + osCancelled);
    let score = 100;
    const warnings: string[] = [];

    if (backlog > 50) {
      score -= 20;
      warnings.push('Alto volume de Ordens de Serviço em aberto (Backlog).');
    }
    if (cancellationRate > 15) {
      score -= 15;
      warnings.push('Taxa de cancelamento elevada (>15%).');
    }
    if (conversionRate < 50 && osCreated > 10) {
      score -= 25;
      warnings.push('Baixa conversão de OS para Fatura Paga (<50%). Risco de fluxo de caixa.');
    }

    let status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' = 'HEALTHY';
    if (score <= 50) {
      status = 'CRITICAL';
    } else if (score < 85) {
      status = 'DEGRADED';
    }

    // Return the shape that ExecutiveDashboard expects
    res.json({
      kpis: {
        totalRevenue,
        avgCompletionTimeHours,
        conversionRate,
        cancellationRate,
        stockMovements,
      },
      funnel: {
        created: osCreated,
        completed: osCompleted,
        invoiced,
        paid,
      },
      health: {
        status,
        score,
        warnings,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao buscar estatísticas do dashboard.' });
    } else {
      logger.error({ err: error }, "An unknown error occurred");
      return res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};
