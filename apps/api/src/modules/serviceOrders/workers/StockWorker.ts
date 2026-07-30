import { prismaClient } from '../../../shared/database/prismaClient';
import { logger } from '../../../shared/logger';

export const StockWorker = {
  async handleOSCompleted(payload: any) {
    const { orderId, number, companyId, branchId, userId, parts, correlationId } = payload;

    logger.info({ correlationId }, `[StockWorker] Processing OS #${number} inventory deduction...`);

    await prismaClient.$transaction(async (tx) => {
      for (const item of parts) {
        // Atomic decrement with safety check
        const stock = await tx.stock.findFirst({
          where: { partId: item.partId, branchId },
        });

        if (stock) {
          await tx.stock.update({
            where: { id: stock.id },
            data: { quantity: { decrement: item.quantity } },
          });

          await tx.inventoryMovement.create({
            data: {
              companyId,
              partId: item.partId,
              branchId,
              userId,
              type: 'OUT',
              quantity: item.quantity,
              reason: `OS Completion #${number} (Async)`,
            },
          });
        }
      }
    });

    logger.info({ correlationId }, `[StockWorker] Inventory for OS #${number} processed successfully.`);
  }
};
