import { prismaClient } from '../../../shared/database/prismaClient';
import { logger } from '../../../shared/logger';

export class StockDashboardService {
  async getStockAnalytics(companyId: string, branchId?: string) {
    logger.info(`[StockDashboardService] Calculating stock analytics`, { companyId, branchId });

    const scope = { companyId, ...(branchId ? { branchId } : {}) };

    // 1. Total Stock Value
    const stocks = await prismaClient.stock.findMany({
      where: scope,
      include: { part: true }
    });

    const totalValue = stocks.reduce((acc, s) => {
      return acc + (s.quantity * Number(s.part.purchasePrice));
    }, 0);

    // 2. Top Used Items (based on movements)
    const topItems = await prismaClient.inventoryMovement.groupBy({
      by: ['partId'],
      where: { ...scope, type: 'OUT' },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5
    });

    const detailedTopItems = await Promise.all(topItems.map(async (item) => {
      const part = await prismaClient.part.findUnique({ where: { id: item.partId } });
      return {
        name: part?.name,
        quantity: item._sum.quantity
      };
    }));

    // 3. Critical Items (below minStock)
    const criticalItems = stocks.filter(s => s.quantity < 5).map(s => ({
      name: s.part.name,
      quantity: s.quantity,
      branchId: s.branchId
    }));

    return {
      totalValue,
      criticalItemsCount: criticalItems.length,
      topUsedItems: detailedTopItems,
      criticalItems: criticalItems.slice(0, 5),
      totalPartsCount: stocks.length
    };
  }

  async getLowStockList(companyId: string, branchId?: string) {
    const scope = { companyId, ...(branchId ? { branchId } : {}) };
    
    const stocks = await prismaClient.stock.findMany({
      where: scope,
      include: { part: true }
    });

    return stocks
      .filter(s => s.quantity < (s.part.minStock || 5))
      .map(s => ({
        id: s.part.id,
        name: s.part.name,
        internalCode: s.part.internalCode,
        quantity: s.quantity,
        minStock: s.part.minStock || 5,
        branchId: s.branchId
      }));
  }
}
