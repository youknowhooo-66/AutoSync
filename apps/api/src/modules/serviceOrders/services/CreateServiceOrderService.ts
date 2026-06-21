import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';
import { AuditLogService } from '../../../shared/audit/AuditLogService';

interface ICreateOSRequest {
  companyId: string;
  userId: string;
  clientId: string;
  vehicleId: string;
  branchId: string;
  mechanicId?: string;
  notes?: string;
  parts?: Array<{
    partId: string;
    quantity: number;
    unitPrice: number;
  }>;
  services?: Array<{
    name: string;
    price: number;
  }>;
}

export class CreateServiceOrderService {
  async execute(data: ICreateOSRequest) {
    const { parts = [], services = [] } = data;

    return await prismaClient.$transaction(async (tx) => {
      // 1. Calculate totals
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

      // 3. Add Parts and Update Stock
      for (const part of parts) {
        // Check stock
        const stock = await tx.stock.findUnique({
          where: {
            partId_branchId: {
              partId: part.partId,
              branchId: data.branchId,
            },
          },
        });

        if (!stock || stock.quantity < part.quantity) {
          throw new AppError(`Insufficient stock for part ID ${part.partId}.`, 400);
        }

        // Create OSPart record
        await tx.oSPart.create({
          data: {
            serviceOrderId: serviceOrder.id,
            partId: part.partId,
            quantity: part.quantity,
            unitPrice: part.unitPrice,
          },
        });

        // Update Stock (Decrement)
        await tx.stock.update({
          where: {
            partId_branchId: {
              partId: part.partId,
              branchId: data.branchId,
            },
          },
          data: {
            quantity: { decrement: part.quantity },
          },
        });

        // Create Movement Record
        await tx.inventoryMovement.create({
          data: {
            partId: part.partId,
            branchId: data.branchId,
            userId: data.userId,
            type: 'OUT',
            quantity: part.quantity,
            reason: `Service Order #${serviceOrder.number}`,
          },
        });
      }

      // 4. Add Services
      for (const service of services) {
        await tx.oSService.create({
          data: {
            serviceOrderId: serviceOrder.id,
            name: service.name,
            price: service.price,
          },
        });
      }

      // 5. Audit Log
      await AuditLogService.log({
        userId: data.userId,
        companyId: data.companyId,
        action: 'SERVICE_ORDER_CREATE',
        resource: 'SERVICE_ORDER',
        resourceId: serviceOrder.id,
        newValue: serviceOrder,
      });

      return serviceOrder;
    });
  }
}
