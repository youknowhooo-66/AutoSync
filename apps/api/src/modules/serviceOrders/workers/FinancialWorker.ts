import { prismaClient } from '../../../shared/database/prismaClient';
import { logger } from '../../../shared/logger';

export const FinancialWorker = {
  async handleOSCompleted(payload: any) {
    const { orderId, number, companyId, branchId, total, correlationId } = payload;

    logger.info({ correlationId }, `[FinancialWorker] Processing revenue for OS #${number}...`);

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
        logger.warn({ correlationId }, `[FinancialWorker] Revenue record for OS #${number} already exists. Skipping.`);
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

      logger.info({ correlationId }, `[FinancialWorker] Revenue for OS #${number} created successfully.`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error({ correlationId, err: error }, `[FinancialWorker] Failed to process revenue for OS #${number}: ${(error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error))}`);
        throw error;
      } else {
        logger.error({ err: error }, "An unknown error occurred");
      }
    }
  }
};
