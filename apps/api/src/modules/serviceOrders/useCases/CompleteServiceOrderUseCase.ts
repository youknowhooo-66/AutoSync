import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';
import { AuditLogService } from '../../../shared/audit/AuditLogService';
import { ServiceOrderStatus } from '../enums/ServiceOrderStatus';

interface IRequest {
  serviceOrderId: string;
  companyId: string;
  userId: string;
}

export class CompleteServiceOrderUseCase {
  async execute({ serviceOrderId, companyId, userId }: IRequest) {
    return await prismaClient.$transaction(async (tx) => {
      // 1. Validate if OS exists and belongs to company
      const serviceOrder = await tx.serviceOrder.findFirst({
        where: { id: serviceOrderId, companyId,  },
        include: {
          parts: true,
          services: true,
        },
      });

      if (!serviceOrder) {
        throw new AppError('Service Order not found.', 404);
      }

      // 2. Validate Status Transitions (State Machine)
      if (serviceOrder.status === 'CANCELLED') {
        throw new AppError('Cannot complete a canceled service order.', 400);
      }

      if (serviceOrder.status === 'FINISHED') {
        throw new AppError('Service order is already completed.', 400);
      }

      // 3. Deduct Stock for all parts
      for (const item of serviceOrder.parts) {
        const stock = await tx.stock.findUnique({
          where: {
            partId_branchId: {
              partId: item.partId,
              branchId: serviceOrder.branchId,
            },
          },
        });

        if (!stock || stock.quantity < item.quantity) {
          const part = await tx.part.findUnique({ where: { id: item.partId } });
          throw new AppError(`Insufficient stock for part: ${part?.name || item.partId}`, 400);
        }

        // Atomically decrement stock
        await tx.stock.update({
          where: { id: stock.id },
          data: { quantity: { decrement: item.quantity } },
        });

        // Record stock movement
        await tx.inventoryMovement.create({
          data: {
            partId: item.partId,
            branchId: serviceOrder.branchId,
            userId,
            type: 'OUT',
            quantity: item.quantity,
            reason: `OS Completion #${serviceOrder.number}`,
          },
        });
      }

      // 4. Update Status to COMPLETED
      const updatedOS = await tx.serviceOrder.update({
        where: { id: serviceOrderId },
        data: {
          status: 'FINISHED',
        },
      });

      // 5. Generate Financial Record (REVENUE)
      await tx.financialRecord.create({
        data: {
          companyId,
          branchId: serviceOrder.branchId,
          type: 'RECEIVABLE',
          category: 'SERVICE_ORDER',
          description: `Revenue from OS #${serviceOrder.number}`,
          amount: serviceOrder.finalValue,
          dueDate: new Date(),
          status: 'PAID',
          paymentDate: new Date(),
        },
      });

      // 6. Audit Log (SaaS standard)
      await AuditLogService.log({
        userId,
        companyId,
        action: 'OS_COMPLETED',
        resource: 'SERVICE_ORDER',
        resourceId: serviceOrder.id,
        oldValue: { status: serviceOrder.status },
        newValue: { status: 'FINISHED' },
      });

      return updatedOS;
    });
  }
}
