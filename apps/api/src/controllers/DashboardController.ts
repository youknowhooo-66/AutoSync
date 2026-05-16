import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { startOfMonth, endOfMonth, subDays, format } from 'date-fns';
import { logger } from "../shared/logger";

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const { branchId } = req.query;
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const where: any = branchId ? { branchId: String(branchId) } : {};

    // 1. Faturamento Mensal
    const financialSummary = await prisma.financialRecord.aggregate({
      where: {
        ...where,
        type: 'RECEIVABLE',
        status: 'PAID',
        paymentDate: {
          gte: monthStart,
          lte: monthEnd
        }
      },
      _sum: {
        amount: true
      }
    });

    // 2. Total de OS no mês
    const osCount = await prisma.serviceOrder.count({
      where: {
        ...where,
        createdAt: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    });

    // 3. Novos Clientes no mês
    const clientCount = await prisma.client.count({
      where: {
        createdAt: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    });

    // 4. Taxa de Conversão (Finalizadas / Totais do mês)
    const finishedOS = await prisma.serviceOrder.count({
      where: {
        ...where,
        status: 'FINISHED',
        createdAt: { gte: monthStart, lte: monthEnd }
      }
    });

    const conversionRate = osCount > 0 ? (finishedOS / osCount) * 100 : 0;

    // 5. Distribuição de Status
    const statusDistribution = await prisma.serviceOrder.groupBy({
      by: ['status'],
      where: {
        ...where,
        createdAt: { gte: monthStart, lte: monthEnd }
      },
      _count: { id: true }
    });

    // 6. Dados para o gráfico (últimos 7 dias)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(now, i);
      const start = new Date(date.setHours(0, 0, 0, 0));
      const end = new Date(date.setHours(23, 59, 59, 999));

      const dayRevenue = await prisma.financialRecord.aggregate({
        where: {
          ...where,
          type: 'RECEIVABLE',
          status: 'PAID',
          paymentDate: { gte: start, lte: end }
        },
        _sum: { amount: true }
      });

      const dayOS = await prisma.serviceOrder.count({
        where: {
          ...where,
          createdAt: { gte: start, lte: end }
        }
      });

      chartData.push({
        name: format(date, 'dd/MM'),
        revenue: Number(dayRevenue._sum.amount || 0),
        os: dayOS
      });
    }

    // 7. Últimas OS
    const recentOS = await prisma.serviceOrder.findMany(({
          where,
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            client: { select: { name: true } },
            vehicle: { select: { model: true } }
          }
        } as unknown as Parameters<typeof prisma.serviceOrder.findMany>[0]));

    res.json({
      monthlyRevenue: Number(financialSummary._sum.amount || 0),
      monthlyOS: osCount,
      newClients: clientCount,
      conversionRate: conversionRate.toFixed(1),
      statusDistribution,
      chartData,
      recentOS
    });
  } catch (error: unknown) {
  if (error instanceof Error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar estatísticas do dashboard.' });
  } else {
    logger.error({ err: error }, "An unknown error occurred");
      return res.status(500).json({ message: 'An unknown error occurred' });  }
}
};
