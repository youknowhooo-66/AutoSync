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
  userId: string;
}

export class CreateServiceOrderUseCase {
  async execute(data: IRequest) {
    return await prismaClient.$transaction(async (tx) => {
      // 0. Validate Tenant ownership & client-vehicle relationship
      const client = await tx.client.findFirst({
        where: {
          id: data.clientId,
          companyId: data.companyId,
        },
      });

      if (!client) {
        throw new AppError('Client not found or belongs to another tenant.', 404);
      }

      const vehicle = await tx.vehicle.findFirst({
        where: {
          id: data.vehicleId,
          companyId: data.companyId,
        },
      });

      if (!vehicle) {
        throw new AppError('Vehicle not found or belongs to another tenant.', 404);
      }

      if (vehicle.clientId !== data.clientId) {
        throw new AppError('Vehicle does not belong to the selected client.', 404);
      }

      const branch = await tx.branch.findFirst({
        where: {
          id: data.branchId,
          companyId: data.companyId,
          deletedAt: null,
        },
      });

      if (!branch) {
        throw new AppError('Branch not found or belongs to another tenant.', 404);
      }

      // 1. Calculate totals
      const parts = data.parts || [];
      const services = data.services || [];

      const totalParts = parts.reduce((acc, p) => acc + (p.quantity * p.unitPrice), 0);
      const totalServices = services.reduce((acc, s) => acc + s.price, 0);
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
      for (const p of parts) {
        // Atomic check and update
        const updated = await tx.stock.updateMany({
          where: {
            partId: p.partId,
            branchId: data.branchId,
            quantity: { gte: p.quantity }
          },
          data: {
            quantity: { decrement: p.quantity }
          }
        });

        if (updated.count === 0) {
          const currentStock = await tx.stock.findUnique({
            where: { partId_branchId: { partId: p.partId, branchId: data.branchId } }
          });
          throw new AppError(`Insufficient stock for part ${p.partId}. Available: ${currentStock?.quantity || 0}`, 400);
        }

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
            userId: (data as any).userId,
            type: 'OUT',
            quantity: p.quantity,
            reason: `Service Order Created (OS: ${serviceOrder.id})`,
          }
        });
      }

      // 4. Create OSServices
      if (services.length > 0) {
        await tx.oSService.createMany({
          data: services.map(s => ({
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
