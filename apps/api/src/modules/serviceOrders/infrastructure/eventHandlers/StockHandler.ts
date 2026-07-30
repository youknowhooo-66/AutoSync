import { prismaClient } from '../../../../shared/database/prismaClient';
import { eventBus } from '../../application/eventBus/EventBus';

export function setupStockHandler() {
  eventBus.on('SERVICE_ORDER_COMPLETED', async (payload) => {
    const { orderId, number, companyId, branchId, userId, parts } = payload;

    console.log(`[StockHandler] Processing OS #${number} completion...`);

    // We use a transaction here to ensure all stock items are updated correctly
    await prismaClient.$transaction(async (tx) => {
      for (const item of parts) {
        // Find stock record
        const stock = await tx.stock.findFirst({
          where: {
            partId: item.partId,
            branchId,
          },
        });

        if (stock) {
          // Decrement stock
          await tx.stock.update({
            where: { id: stock.id },
            data: { quantity: { decrement: item.quantity } },
          });

          // Record movement
          await tx.inventoryMovement.create({
            data: {
              companyId,
              partId: item.partId,
              branchId,
              userId,
              type: 'OUT',
              quantity: item.quantity,
              reason: `OS Completion #${number}`,
            },
          });
        }
      }
    });
  });
}
