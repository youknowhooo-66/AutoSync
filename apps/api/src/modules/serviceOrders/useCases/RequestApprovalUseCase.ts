import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';
import { Prisma } from '@prisma/client';

export interface BudgetApprovalSnapshot {
  schemaVersion: 1;
  serviceOrder: {
    id: string;
    number: number;
    clientId: string;
    vehicleId: string;
    branchId: string;
  };
  parts: Array<{
    id: string;
    stockItemId: string;
    code: string | null;
    description: string;
    quantity: string;
    unitPrice: string;
    total: string;
  }>;
  services: Array<{
    id: string;
    description: string;
    quantity: string;
    unitPrice: string;
    total: string;
  }>;
  totals: {
    totalParts: string;
    totalServices: string;
    discount: string;
    finalValue: string;
  };
}

export class RequestApprovalUseCase {
  async execute(serviceOrderId: string, companyId: string, requestedById: string) {
    try {
      return await prismaClient.$transaction(async (tx) => {
        // 1. Fetch OS with parts & services
        const os = await tx.serviceOrder.findFirst({
          where: { id: serviceOrderId, companyId },
          include: {
            parts: {
              include: { part: true }
            },
            services: true
          }
        });

        if (!os) {
          throw new AppError('Ordem de Serviço não encontrada', 404);
        }

        // 3. Block if OS is FINISHED or CANCELLED
        if (os.status === 'FINISHED' || os.status === 'CANCELLED') {
          throw new AppError('Não é possível solicitar aprovação para uma OS finalizada ou cancelada', 400);
        }

      // 4. Confirm absence of PENDING or APPROVED approvals
      const existingActiveApproval = await tx.serviceOrderApproval.findFirst({
        where: {
          serviceOrderId,
          companyId,
          status: { in: ['PENDING', 'APPROVED'] }
        }
      });

      if (existingActiveApproval) {
        throw new AppError(
          `Já existe uma solicitação com status ${existingActiveApproval.status} para esta OS.`,
          400
        );
      }

      // 5. Check if budget is not empty
      if (os.parts.length === 0 && os.services.length === 0) {
        throw new AppError('Não é possível aprovar um orçamento vazio', 400);
      }

      // 6. Recalculate totals
      let calculatedTotalParts = new Prisma.Decimal(0);
      let calculatedTotalServices = new Prisma.Decimal(0);

      // Collect parts with their stockItemId
      const partsSnapshot: BudgetApprovalSnapshot['parts'] = [];
      for (const p of os.parts) {
        // Find stock item
        const stock = p.partId ? await tx.stock.findUnique({
          where: {
            partId_branchId: {
              partId: p.partId,
              branchId: os.branchId
            }
          }
        }) : null;

        const partTotal = new Prisma.Decimal(p.unitPrice).mul(p.quantity);
        calculatedTotalParts = calculatedTotalParts.add(partTotal);

        partsSnapshot.push({
          id: p.id,
          stockItemId: stock?.id || '',
          code: p.part?.internalCode || '',
          description: p.part?.name || p.description || '',
          quantity: p.quantity.toString(),
          unitPrice: p.unitPrice.toString(),
          total: partTotal.toString()
        });
      }

      const servicesSnapshot: BudgetApprovalSnapshot['services'] = [];
      for (const s of os.services) {
        const serviceTotal = new Prisma.Decimal(s.price);
        calculatedTotalServices = calculatedTotalServices.add(serviceTotal);

        servicesSnapshot.push({
          id: s.id,
          description: s.name,
          quantity: '1',
          unitPrice: s.price.toString(),
          total: serviceTotal.toString()
        });
      }

      const calculatedFinalValue = calculatedTotalParts
        .add(calculatedTotalServices)
        .sub(new Prisma.Decimal(os.discount));

      if (calculatedFinalValue.lessThan(0)) {
        throw new AppError('O valor final do orçamento não pode ser negativo', 400);
      }

      // 7. Determine version
      const aggregations = await tx.serviceOrderApproval.aggregate({
        where: { serviceOrderId },
        _max: { version: true }
      });
      const nextVersion = (aggregations._max.version || 0) + 1;

      // 8. Build snapshot
      const snapshot: BudgetApprovalSnapshot = {
        schemaVersion: 1,
        serviceOrder: {
          id: os.id,
          number: os.number,
          clientId: os.clientId,
          vehicleId: os.vehicleId,
          branchId: os.branchId
        },
        parts: partsSnapshot,
        services: servicesSnapshot,
        totals: {
          totalParts: calculatedTotalParts.toString(),
          totalServices: calculatedTotalServices.toString(),
          discount: os.discount.toString(),
          finalValue: calculatedFinalValue.toString()
        }
      };

      // 9. Create Approval PENDING
      const approval = await tx.serviceOrderApproval.create({
        data: {
          serviceOrderId: os.id,
          companyId,
          branchId: os.branchId,
          version: nextVersion,
          status: 'PENDING',
          snapshotVersion: 1,
          snapshot: snapshot as any,
          totalParts: calculatedTotalParts,
          totalServices: calculatedTotalServices,
          discount: os.discount,
          finalValue: calculatedFinalValue,
          requestedById,
          approvalMethod: 'ASSISTED'
        }
      });

      return approval;
    });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('Conflito de concorrência: já existe uma solicitação de aprovação sendo processada para esta OS.', 409);
      }
      throw error;
    }
  }
}
