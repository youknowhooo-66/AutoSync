import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';
import { Prisma } from '@prisma/client';

interface IPartRequest {
  stockId: string;
  quantity: number;
  unitPrice?: string; // Optional, defaults to catalog salePrice
}

interface IServiceRequest {
  description: string;
  quantity: number;
  unitPrice: string;
}

interface IRequest {
  serviceOrderId: string;
  companyId: string;
  userId: string;
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

    if (os.status === 'FINISHED' || os.status === 'CANCELLED') {
      throw new AppError(`Cannot add items to a ${os.status} service order.`, 400);
    }

    const activeApproval = await prismaClient.serviceOrderApproval.findFirst({
      where: {
        serviceOrderId: data.serviceOrderId,
        companyId: data.companyId,
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
      const parts = data.parts || [];
      const services = data.services || [];

      let addedPartsCost = new Prisma.Decimal(0);
      let addedServicesCost = new Prisma.Decimal(0);

      // Add parts (Planned Need)
      for (const p of parts) {
        if (p.quantity <= 0) {
          throw new AppError('Part quantity must be greater than zero.', 400);
        }

        const stock = await tx.stock.findFirst({
          where: { 
            id: p.stockId, 
            companyId: data.companyId,
            branchId: os.branchId // Must belong to the same branch
          },
          include: { part: true }
        });

        if (!stock) {
          throw new AppError(`Stock item not found or belongs to another branch/tenant.`, 404);
        }

        // Determine unit price
        let resolvedUnitPrice = new Prisma.Decimal(0);
        if (p.unitPrice && p.unitPrice.trim() !== '') {
          resolvedUnitPrice = new Prisma.Decimal(p.unitPrice);
          if (resolvedUnitPrice.lessThan(0)) {
            throw new AppError('Part unit price cannot be negative.', 400);
          }
        } else {
          resolvedUnitPrice = new Prisma.Decimal(stock.part.salePrice || stock.part.price || 0);
        }

        // We DO NOT deduct stock.quantity here. This is a planned need (orçamento).
        // We DO NOT create InventoryMovement OUT here.
        
        await tx.oSPart.create({
          data: {
            serviceOrderId: data.serviceOrderId,
            partId: stock.partId, // OSPart links to Part, not Stock directly
            quantity: p.quantity,
            unitPrice: resolvedUnitPrice,
          },
        });

        const partTotal = resolvedUnitPrice.mul(p.quantity);
        addedPartsCost = addedPartsCost.add(partTotal);
      }

      // Add services
      for (const s of services) {
        if (s.quantity <= 0) {
          throw new AppError('Service quantity must be greater than zero.', 400);
        }

        const unitPrice = new Prisma.Decimal(s.unitPrice);
        if (unitPrice.lessThan(0)) {
          throw new AppError('Service unit price cannot be negative.', 400);
        }

        const serviceTotal = unitPrice.mul(s.quantity);

        // Note: OSService schema does not have 'quantity' or 'unitPrice', only 'price'.
        // We store the calculated total as 'price' and we can append quantity info in the name if needed.
        const serviceName = s.quantity > 1 ? `${s.description} (x${s.quantity})` : s.description;

        await tx.oSService.create({
          data: {
            serviceOrderId: data.serviceOrderId,
            name: serviceName,
            price: serviceTotal,
          },
        });

        addedServicesCost = addedServicesCost.add(serviceTotal);
      }

      // Recalculate totals
      const newTotalParts = new Prisma.Decimal(os.totalParts).add(addedPartsCost);
      const newTotalServices = new Prisma.Decimal(os.totalServices).add(addedServicesCost);
      const newFinalValue = newTotalParts.add(newTotalServices).sub(new Prisma.Decimal(os.discount));

      const updated = await tx.serviceOrder.update({
        where: { id: data.serviceOrderId },
        data: {
          totalParts: newTotalParts,
          totalServices: newTotalServices,
          finalValue: newFinalValue,
        },
        include: {
          parts: { include: { part: true } },
          services: true,
        }
      });

      return updated;
    });
  }
}
