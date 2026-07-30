import { prismaClient } from '../../../shared/database/prismaClient';
import { logger } from '../../../shared/logger';
import { Prisma } from '@prisma/client';

export class StockDashboardService {
  async getStockAnalytics(companyId: string, branchId?: string) {
    logger.info({ companyId, branchId }, `[StockDashboardService] Calculating stock analytics`);

    const scope = { companyId, ...(branchId ? { branchId } : {}) };

    // 1. Total Stock Value
    const stocks = await prismaClient.stock.findMany({
      where: scope,
      include: { part: true }
    });

    let totalVal = new Prisma.Decimal(0);
    for (const s of stocks) {
      const qty = new Prisma.Decimal(s.quantity);
      const price = new Prisma.Decimal(s.part.purchasePrice || 0);
      totalVal = totalVal.add(qty.mul(price));
    }
    const totalValue = totalVal.toFixed(2);

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
        quantity: item._sum.quantity ? new Prisma.Decimal(item._sum.quantity).toString() : '0.000'
      };
    }));

    // 3. Critical Items (below minStock)
    const criticalItems = stocks.filter(s => new Prisma.Decimal(s.quantity).lessThan(5)).map(s => ({
      name: s.part.name,
      quantity: s.quantity.toString(),
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
      .filter(s => new Prisma.Decimal(s.quantity).lessThan(s.part.minStock || 5))
      .map(s => ({
        id: s.part.id,
        name: s.part.name,
        internalCode: s.part.internalCode,
        quantity: s.quantity.toString(),
        minStock: s.part.minStock || 5,
        branchId: s.branchId
      }));
  }
}
