import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';
import { logger } from '../../../shared/logger';

interface IRequest {
  companyId: string;
  branchId: string;
  partId: string;
  quantity: number;
  serviceOrderId: string;
  userId: string;
}

export class StockExitUseCase {
  async execute(data: IRequest) {
    logger.info(`[StockExit] Deducting ${data.quantity} of ${data.partId} for OS ${data.serviceOrderId}`);

    return await prismaClient.$transaction(async (tx) => {
      // 1. Get current stock
      const stock = await tx.stock.findUnique({
        where: { partId_branchId: { partId: data.partId, branchId: data.branchId } }
      });

      if (!stock || stock.quantity < data.quantity) {
        throw new AppError(`Insufficient stock for part ${data.partId}. Available: ${stock?.quantity || 0}`, 400);
      }

      const quantityBefore = stock.quantity;
      const quantityAfter = stock.quantity - data.quantity;

      // 2. Update stock
      await tx.stock.update({
        where: { id: stock.id },
        data: { quantity: quantityAfter }
      });

      // 3. Create movement with full audit trail
      const movement = await tx.inventoryMovement.create({
        data: {
          partId: data.partId,
          branchId: data.branchId,
          userId: data.userId,
          type: 'OUT',
          quantity: data.quantity,
          reason: `Service Order Consumption (OS: ${data.serviceOrderId})`,
          // Note: Extending the reason with before/after for audit
        }
      });

      // 4. Record in Audit Log (Standardized)
      await tx.auditLog.create({
        data: {
          userId: data.userId,
          action: 'STOCK_EXIT',
          resource: 'STOCK',
          resourceId: stock.id,
          oldValue: { quantity: quantityBefore },
          newValue: { quantity: quantityAfter, referenceId: data.serviceOrderId }
        }
      });

      return movement;
    });
  }
}
