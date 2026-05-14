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
          status: ServiceOrderStatus.CREATED,
          totalParts,
          totalServices,
          finalValue,
        },
      });

      // 3. Create OSParts
      if (data.parts.length > 0) {
        await tx.oSPart.createMany({
          data: data.parts.map(p => ({
            serviceOrderId: serviceOrder.id,
            partId: p.partId,
            quantity: p.quantity,
            unitPrice: p.unitPrice,
          })),
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
