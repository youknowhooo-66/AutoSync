import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';
import { logger } from '../../../shared/logger';

interface IRequest {
  companyId: string;
  partId: string;
  sourceBranchId: string;
  targetBranchId: string;
  quantity: number;
  userId: string;
}

export class StockTransferUseCase {
  async execute(data: IRequest) {
    if (data.sourceBranchId === data.targetBranchId) {
      throw new AppError('Source and Target branches must be different.', 400);
    }

    if (data.quantity <= 0) {
      throw new AppError('Quantity must be greater than zero.', 400);
    }

    logger.info(`[StockTransferUseCase] Transferring ${data.quantity} of ${data.partId} from ${data.sourceBranchId} to ${data.targetBranchId}`);

    return await prismaClient.$transaction(async (tx) => {
      // 1. Check Source Stock
      const sourceStock = await tx.stock.findUnique({
        where: { partId_branchId: { partId: data.partId, branchId: data.sourceBranchId } }
      });

      if (!sourceStock || sourceStock.quantity < data.quantity) {
        throw new AppError('Insufficient stock in source branch.', 400);
      }

      // 2. Deduct from Source
      await tx.stock.update({
        where: { id: sourceStock.id },
        data: { quantity: { decrement: data.quantity } }
      });

      // 3. Increment in Target
      const targetStock = await tx.stock.findUnique({
        where: { partId_branchId: { partId: data.partId, branchId: data.targetBranchId } }
      });

      if (!targetStock) {
        await tx.stock.create({
          data: {
            companyId: data.companyId,
            branchId: data.targetBranchId,
            partId: data.partId,
            quantity: data.quantity
          }
        });
      } else {
        await tx.stock.update({
          where: { id: targetStock.id },
          data: { quantity: { increment: data.quantity } }
        });
      }

      // 4. Record Transfer Movement
      const movement = await tx.inventoryMovement.create({
        data: {
          partId: data.partId,
          branchId: data.sourceBranchId, // Record at source
          userId: data.userId,
          type: 'TRANSFER',
          quantity: data.quantity,
          sourceBranchId: data.sourceBranchId,
          targetBranchId: data.targetBranchId,
          reason: `Transfer to branch ${data.targetBranchId}`,
        }
      });

      return movement;
    });
  }
}
