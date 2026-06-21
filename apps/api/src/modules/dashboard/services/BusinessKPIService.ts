import { prismaClient } from '../../../shared/database/prismaClient';
import { logger } from '../../../shared/logger';
import { subDays, format } from 'date-fns';

export class BusinessKPIService {
  async getExecutiveMetrics(companyId: string, branchId?: string) {
    logger.info({ companyId, branchId }, `[BusinessKPIService] Calculating executive metrics`);

    const scope = { companyId, ...(branchId ? { branchId } : {}) };

    // 1. Revenue Metrics
    const revenue = await prismaClient.financialRecord.aggregate({
      where: {
        companyId,
        type: 'RECEIVABLE',
        status: 'PAID',
        ...(branchId ? { branchId } : {}),
      },
      _sum: { amount: true }
    });

    const totalRevenue = Number(revenue._sum.amount || 0);

    const osCreated = await prismaClient.serviceOrder.count({ where: scope });
    const osCompleted = await prismaClient.serviceOrder.count({ where: { ...scope, status: 'FINISHED' } });
    const osCancelled = await prismaClient.serviceOrder.count({ where: { ...scope, status: 'CANCELLED' } });
    
    // Funnel count
    const created = osCreated;
    const completed = osCompleted;

    const invoiced = await prismaClient.financialRecord.count({
      where: {
        companyId,
        type: 'RECEIVABLE',
        ...(branchId ? { branchId } : {}),
      }
    });

    const paid = await prismaClient.financialRecord.count({
      where: {
        companyId,
        type: 'RECEIVABLE',
        status: 'PAID',
        ...(branchId ? { branchId } : {}),
      }
    });

    // Conversion & Cancellation rates
    const conversionRate = created > 0 ? (paid / created) * 100 : 0;
    const cancellationRate = created > 0 ? (osCancelled / created) * 100 : 0;
    
    const movementScope = branchId ? { branchId, part: { companyId } } : { part: { companyId } };
    const stockMovements = await prismaClient.inventoryMovement.count({ where: movementScope });

    // Average completion time
    const finishedOrders = await prismaClient.serviceOrder.findMany({
      where: { ...scope, status: 'FINISHED' },
      select: { createdAt: true, updatedAt: true }
    });

    let avgCompletionTimeHours = 4.5; // fallback
    if (finishedOrders.length > 0) {
      const totalMs = finishedOrders.reduce((acc, os) => {
        return acc + (os.updatedAt.getTime() - os.createdAt.getTime());
      }, 0);
      avgCompletionTimeHours = totalMs / finishedOrders.length / (1000 * 60 * 60);
    }

    // Health Evaluation
    const backlog = osCreated - (osCompleted + osCancelled);
    let healthScore = 100;
    const warnings: string[] = [];

    if (backlog > 50) {
      healthScore -= 20;
      warnings.push('Alto volume de Ordens de Serviço em aberto (Backlog).');
    }
    if (cancellationRate > 15) {
      healthScore -= 15;
      warnings.push('Taxa de cancelamento elevada (>15%).');
    }
    if (conversionRate < 50 && osCreated > 10) {
      healthScore -= 25;
      warnings.push('Baixa conversão de OS para Fatura Paga (<50%). Risco de fluxo de caixa.');
    }

    let healthStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' = 'HEALTHY';
    if (healthScore <= 50) {
      healthStatus = 'CRITICAL';
    } else if (healthScore < 85) {
      healthStatus = 'DEGRADED';
    }

    // 7-day chart data for backward compatibility (used by Reports page)
    const chartData = [];
    const chartNow = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = subDays(chartNow, i);
      const start = new Date(date.setHours(0, 0, 0, 0));
      const end = new Date(date.setHours(23, 59, 59, 999));

      const dayRevenue = await prismaClient.financialRecord.aggregate({
        where: {
          companyId,
          type: 'RECEIVABLE',
          status: 'PAID',
          paymentDate: { gte: start, lte: end },
          ...(branchId ? { branchId } : {}),
        },
        _sum: { amount: true }
      });

      const dayOS = await prismaClient.serviceOrder.count({
        where: {
          companyId,
          createdAt: { gte: start, lte: end },
          ...(branchId ? { branchId } : {}),
        }
      });

      chartData.push({
        name: format(date, 'dd/MM'),
        revenue: Number(dayRevenue._sum.amount || 0),
        os: dayOS
      });
    }

    return {
      // New format (used by ExecutiveDashboard)
      health: {
        score: healthScore,
        status: healthStatus,
        warnings
      },
      kpis: {
        totalRevenue,
        avgCompletionTimeHours,
        conversionRate,
        cancellationRate,
        stockMovements
      },
      funnel: {
        created,
        completed,
        invoiced,
        paid
      },
      raw: {},

      // Backward compatibility (used by legacy Reports page)
      monthlyRevenue: totalRevenue,
      conversionRate: conversionRate.toFixed(1),
      chartData
    };
  }
}
