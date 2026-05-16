import { prismaClient } from '../../../../shared/database/prismaClient';
import { eventBus } from '../../application/eventBus/EventBus';

export function setupFinancialHandler() {
  eventBus.on('SERVICE_ORDER_COMPLETED', async (payload) => {
    const { orderId, number, companyId, branchId, total } = payload;

    console.log(`[FinancialHandler] Creating revenue for OS #${number}...`);

    await prismaClient.financialRecord.create({
      data: {
        companyId,
        branchId,
        type: 'RECEIVABLE',
        category: 'SERVICE_ORDER',
        description: `Revenue from OS #${number}`,
        amount: total,
        dueDate: new Date(),
        status: 'PAID',
        paymentDate: new Date(),
        // referenceId: orderId // Add this field if exists in schema
      },
    });
  });
}
