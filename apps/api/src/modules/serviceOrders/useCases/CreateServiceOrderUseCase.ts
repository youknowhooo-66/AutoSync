import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';
import { ServiceOrderStatus } from '../enums/ServiceOrderStatus';

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
  companyId: string;
  clientId: string;
  vehicleId: string;
  branchId: string;
  mechanicId?: string;
  notes?: string;
  parts: IPartRequest[];
  services: IServiceRequest[];
}

export class CreateServiceOrderUseCase {
  async execute(data: IRequest) {
    return await prismaClient.$transaction(async (tx) => {
      // 1. Calculate totals
      const totalParts = data.parts.reduce((acc, p) => acc + (p.quantity * p.unitPrice), 0);
      const totalServices = data.services.reduce((acc, s) => acc + s.price, 0);
      const finalValue = totalParts + totalServices;

      // 2. Create Service Order
      const serviceOrder = await tx.serviceOrder.create({
        data: {
          companyId: data.companyId,
          clientId: data.clientId,
          vehicleId: data.vehicleId,
          branchId: data.branchId,
          mechanicId: data.mechanicId,
          notes: data.notes,
          status: 'OPEN',
          totalParts,
          totalServices,
          finalValue,
        },
      });

      // 3. Create OSParts & Update Stock
      for (const p of data.parts) {
        // a. Verify Stock
        const stock = await tx.stock.findUnique({
          where: { partId_branchId: { partId: p.partId, branchId: data.branchId } }
        });

        if (!stock || stock.quantity < p.quantity) {
          throw new AppError(`Insufficient stock for part ${p.partId}. Available: ${stock?.quantity || 0}`, 400);
        }

        // b. Deduct Stock
        await tx.stock.update({
          where: { id: stock.id },
          data: { quantity: { decrement: p.quantity } }
        });

        // c. Record OSPart
        await tx.oSPart.create({
          data: {
            serviceOrderId: serviceOrder.id,
            partId: p.partId,
            quantity: p.quantity,
            unitPrice: p.unitPrice,
          },
        });

        // d. Record Movement & Audit
        await tx.inventoryMovement.create({
          data: {
            partId: p.partId,
            branchId: data.branchId,
            userId: (data as any).userId || 'system',
            type: 'OUT',
            quantity: p.quantity,
            reason: `Service Order Created (OS: ${serviceOrder.id})`,
          }
        });
      }

      // 4. Create OSServices
      if (data.services.length > 0) {
        await tx.oSService.createMany({
          data: data.services.map(s => ({
            serviceOrderId: serviceOrder.id,
            name: s.name,
            price: s.price,
          })),
        });
      }

      return serviceOrder;
    });
  }
}
