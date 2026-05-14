import { prismaClient } from '../../../shared/database/prismaClient';
import { logger } from '../../../shared/logger';

export const FinancialWorker = {
  async handleOSCompleted(payload: any) {
    const { orderId, number, companyId, branchId, total, correlationId } = payload;

    logger.info(`[FinancialWorker] Processing revenue for OS #${number}...`, { correlationId });

    try {
      // Idempotency check: Check if OS revenue already exists
      const existingRecord = await prismaClient.financialRecord.findFirst({
        where: { 
          companyId,
          description: { contains: `OS #${number}` },
          category: 'SERVICE_ORDER'
        }
      });

      if (existingRecord) {
        logger.warn(`[FinancialWorker] Revenue record for OS #${number} already exists. Skipping.`, { correlationId });
        return;
      }

      await prismaClient.financialRecord.create({
        data: {
          companyId,
          branchId,
          type: 'RECEIVABLE',
          category: 'SERVICE_ORDER',
          description: `Revenue from OS #${number} (Async)`,
          amount: total,
          dueDate: new Date(),
          status: 'PAID',
          paymentDate: new Date(),
        },
      });

      logger.info(`[FinancialWorker] Revenue for OS #${number} created successfully.`, { correlationId });
    } catch (error) {
      logger.error(`[FinancialWorker] Failed to process revenue for OS #${number}: ${error.message}`, { correlationId, error });
      throw error; // Re-throw to trigger BullMQ retry
    }
  }
};
