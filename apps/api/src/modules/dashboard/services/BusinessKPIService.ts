import { prismaClient } from '../../../shared/database/prismaClient';
import { logger } from '../../../shared/logger';

export class BusinessKPIService {
  async getExecutiveMetrics(companyId: string, branchId?: string) {
    logger.info({ companyId, branchId }, `[BusinessKPIService] Calculating executive metrics`);

    const scope = { companyId, ...(branchId ? { branchId } : {}) };

    // 1. Revenue Metrics
    const revenue = await prismaClient.financialRecord.aggregate({
      where: { ...scope, type: 'RECEIVABLE', status: 'PAID', deletedAt: null },
      _sum: { amount: true }
    });

    // 2. OS Statistics
    const osStats = await prismaClient.serviceOrder.groupBy({
      by: ['status'],
      where: { ...scope, deletedAt: null },
      _count: { id: true }
    });

    // 3. Status Distribution for Charts
    const statusDistribution = osStats.map(s => ({
      status: s.status,
      _count: { id: s._count.id }
    }));

    // 4. Monthly Statistics (Mocking some for now, should calculate over time)
    const monthlyOS = osStats.reduce((acc, s) => acc + s._count.id, 0);

    // 5. Chart Data (Last 7 days revenue & OS)
    const chartData = [
      { name: 'Seg', revenue: 1200, os: 4 },
      { name: 'Ter', revenue: 1900, os: 6 },
      { name: 'Qua', revenue: 1500, os: 5 },
      { name: 'Qui', revenue: 2200, os: 8 },
      { name: 'Sex', revenue: 2800, os: 10 },
      { name: 'Sáb', revenue: 1800, os: 5 },
      { name: 'Dom', revenue: 500, os: 2 },
    ];

    // 6. Recent OS
    const recentOS = await prismaClient.serviceOrder.findMany({
      where: { ...scope, deletedAt: null },
      include: { client: true, vehicle: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    return {
      monthlyRevenue: Number(revenue._sum.amount || 0),
      monthlyOS,
      newClients: 12, // Should be calculated
      conversionRate: 85, // Should be calculated
      statusDistribution,
      chartData,
      recentOS
    };
  }
}
