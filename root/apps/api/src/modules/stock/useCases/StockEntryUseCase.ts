import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';
import { logger } from '../../../shared/logger';

interface IRequest {
  companyId: string;
  branchId: string;
  partId: string;
  quantity: number;
  unitCost: number;
  supplierId?: string;
  userId: string;
}

export class StockEntryUseCase {
  async execute(data: IRequest) {
    logger.info(`[StockEntryUseCase] Processing entry for part ${data.partId} in branch ${data.branchId}`);

    return await prismaClient.$transaction(async (tx) => {
      // 1. Update Stock Quantity
      const stock = await tx.stock.findUnique({
        where: { partId_branchId: { partId: data.partId, branchId: data.branchId } }
      });

      if (!stock) {
        // Create initial stock record if not exists
        await tx.stock.create({
          data: {
            companyId: data.companyId,
            branchId: data.branchId,
            partId: data.partId,
            quantity: data.quantity
          }
        });
      } else {
        await tx.stock.update({
          where: { id: stock.id },
          data: { quantity: { increment: data.quantity } }
        });
      }

      // 2. Update Part Cost (Weighted Average or Last Purchase)
      await tx.part.update({
        where: { id: data.partId },
        data: { purchasePrice: data.unitCost }
      });

      // 3. Record Movement
      const movement = await tx.inventoryMovement.create({
        data: {
          partId: data.partId,
          branchId: data.branchId,
          userId: data.userId,
          type: 'IN',
          quantity: data.quantity,
          reason: `Stock Purchase / Entry (Cost: ${data.unitCost})`,
        }
      });

      return movement;
    });
  }
}
