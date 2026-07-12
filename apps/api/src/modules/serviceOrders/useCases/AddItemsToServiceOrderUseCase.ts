import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';

interface IPartRequest {
  partId: string;
  quantity: number;
  unitPrice: number;
}

interface IServiceRequest {
  name: string;
  price: number;
}

interface IRequest {
  serviceOrderId: string;
  companyId: string;
  userId?: string;
  parts?: IPartRequest[];
  services?: IServiceRequest[];
}

export class AddItemsToServiceOrderUseCase {
  async execute(data: IRequest) {
    const os = await prismaClient.serviceOrder.findFirst({
      where: { id: data.serviceOrderId, companyId: data.companyId },
    });

    if (!os) {
      throw new AppError('Service Order not found.', 404);
    }

    return await prismaClient.$transaction(async (tx) => {
      const parts = data.parts || [];
      const services = data.services || [];

      let addedPartsCost = 0;
      let addedServicesCost = 0;

      // Add parts
      for (const p of parts) {
        // Check stock
        const stock = await tx.stock.findFirst({
          where: { partId: p.partId, branchId: os.branchId },
        });

        if (!stock || stock.quantity < p.quantity) {
          throw new AppError(
            `Insufficient stock for part ${p.partId}. Available: ${stock?.quantity || 0}`,
            400,
          );
        }

        // Deduct stock
        await tx.stock.update({
          where: { id: stock.id },
          data: { quantity: { decrement: p.quantity } },
        });

        // Record OSPart
        await tx.oSPart.create({
          data: {
            serviceOrderId: data.serviceOrderId,
            partId: p.partId,
            quantity: p.quantity,
            unitPrice: p.unitPrice,
          },
        });

        // Audit movement
        await tx.inventoryMovement.create({
          data: {
            partId: p.partId,
            branchId: os.branchId,
            userId: data.userId || 'system',
            type: 'OUT',
            quantity: p.quantity,
            reason: `Added to Service Order (OS: ${data.serviceOrderId})`,
          },
        });

        addedPartsCost += p.quantity * p.unitPrice;
      }

      // Add services
      if (services.length > 0) {
        await tx.oSService.createMany({
          data: services.map((s) => ({
            serviceOrderId: data.serviceOrderId,
            name: s.name,
            price: s.price,
          })),
        });
        addedServicesCost = services.reduce((acc, s) => acc + s.price, 0);
      }

      // Recalculate totals
      const newTotalParts = Number(os.totalParts) + addedPartsCost;
      const newTotalServices = Number(os.totalServices) + addedServicesCost;
      const newFinalValue = newTotalParts + newTotalServices;

      const updated = await tx.serviceOrder.update({
        where: { id: data.serviceOrderId },
        data: {
          totalParts: newTotalParts,
          totalServices: newTotalServices,
          finalValue: newFinalValue,
        },
      });

      return updated;
    });
  }
}
