import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';
import { Prisma } from '@prisma/client';

export class RemoveItemFromServiceOrderUseCase {
  async execute(serviceOrderId: string, companyId: string, itemId: string, itemType: 'PART' | 'SERVICE') {
    const os = await prismaClient.serviceOrder.findFirst({
      where: { id: serviceOrderId, companyId },
    });

    if (!os) {
      throw new AppError('Service Order not found.', 404);
    }

    if (os.status === 'FINISHED' || os.status === 'CANCELLED') {
      throw new AppError(`Cannot remove items from a ${os.status} service order.`, 400);
    }

    const activeApproval = await prismaClient.serviceOrderApproval.findFirst({
      where: {
        serviceOrderId,
        companyId,
        status: { in: ['PENDING', 'APPROVED'] }
      }
    });

    if (activeApproval) {
      throw new AppError(
        `Não é possível alterar os itens pois o orçamento está em status ${activeApproval.status}. Cancele ou invalide a aprovação antes de prosseguir.`,
        400
      );
    }

    return await prismaClient.$transaction(async (tx) => {
      let deduction = new Prisma.Decimal(0);

      if (itemType === 'PART') {
        const part = await tx.oSPart.findFirst({
          where: { id: itemId, serviceOrderId },
        });

        if (!part) {
          throw new AppError('Part item not found in this OS.', 404);
        }

        deduction = new Prisma.Decimal(part.unitPrice).mul(part.quantity);

        await tx.oSPart.delete({
          where: { id: itemId },
        });

        // Recalculate OS totals
        const newTotalParts = new Prisma.Decimal(os.totalParts).sub(deduction);
        const newFinalValue = newTotalParts.add(new Prisma.Decimal(os.totalServices)).sub(new Prisma.Decimal(os.discount));

        return await tx.serviceOrder.update({
          where: { id: serviceOrderId },
          data: {
            totalParts: newTotalParts,
            finalValue: newFinalValue,
          },
        });
      } else if (itemType === 'SERVICE') {
        const service = await tx.oSService.findFirst({
          where: { id: itemId, serviceOrderId },
        });

        if (!service) {
          throw new AppError('Service item not found in this OS.', 404);
        }

        deduction = new Prisma.Decimal(service.price);

        await tx.oSService.delete({
          where: { id: itemId },
        });

        // Recalculate OS totals
        const newTotalServices = new Prisma.Decimal(os.totalServices).sub(deduction);
        const newFinalValue = new Prisma.Decimal(os.totalParts).add(newTotalServices).sub(new Prisma.Decimal(os.discount));

        return await tx.serviceOrder.update({
          where: { id: serviceOrderId },
          data: {
            totalServices: newTotalServices,
            finalValue: newFinalValue,
          },
        });
      } else {
        throw new AppError('Invalid item type.', 400);
      }
    });
  }
}
