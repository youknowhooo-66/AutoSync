import { prismaClient } from '../../../shared/database/prismaClient';
import { logger } from '../../../shared/logger';
import { Prisma } from '@prisma/client';

interface IRequest {
  companyId: string;
  branchId: string;
  partId: string;
  quantity: number;
  serviceOrderId: string;
  userId: string;
  reason?: string;
}

export class StockReturnUseCase {
  async execute(data: IRequest) {
    logger.info(`[StockReturn] Restoring ${data.quantity} of ${data.partId} from OS ${data.serviceOrderId}`);

    return await prismaClient.$transaction(async (tx) => {
      // 1. Get current stock
      const stock = await tx.stock.findUnique({
        where: { partId_branchId: { partId: data.partId, branchId: data.branchId } }
      });

      if (!stock) {
        // This should not happen if the part was correctly added to OS
        return await tx.stock.create({
          data: {
            companyId: data.companyId,
            branchId: data.branchId,
            partId: data.partId,
            quantity: new Prisma.Decimal(data.quantity)
          }
        });
      }

      const quantityBefore = stock.quantity;
      const quantityAfter = quantityBefore.add(data.quantity);

      // 2. Update stock
      await tx.stock.update({
        where: { id: stock.id },
        data: { quantity: quantityAfter }
      });

      // 3. Create movement
      await tx.inventoryMovement.create({
        data: {
          partId: data.partId,
          branchId: data.branchId,
          userId: data.userId,
          type: 'RETURN',
          quantity: new Prisma.Decimal(data.quantity),
          reason: data.reason || `Service Order Return (OS: ${data.serviceOrderId})`,
        }
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          userId: data.userId,
          action: 'STOCK_RETURN',
          resource: 'STOCK',
          resourceId: stock.id,
          oldValue: { quantity: quantityBefore },
          newValue: { quantity: quantityAfter, referenceId: data.serviceOrderId }
        }
      });
    });
  }
}
