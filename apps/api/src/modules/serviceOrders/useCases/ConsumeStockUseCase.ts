import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';
import { Prisma } from '@prisma/client';

interface ConsumeStockRequest {
  serviceOrderId: string;
  osPartId: string;
  quantity: number;
  companyId: string;
  userId: string;
  userRole: string;
  idempotencyKey: string;
}

export class ConsumeStockUseCase {
  async execute({ serviceOrderId, osPartId, quantity, companyId, userId, userRole, idempotencyKey }: ConsumeStockRequest) {
    if (!idempotencyKey) {
      throw new AppError('Chave de idempotência (Idempotency-Key) é obrigatória', 400);
    }

    if (quantity <= 0) {
      throw new AppError('A quantidade solicitada deve ser maior que zero', 400);
    }

    // 1. Check idempotency first (outside transaction, fast path)
    const existingMovement = await prismaClient.inventoryMovement.findUnique({
      where: { idempotencyKey }
    });

    if (existingMovement) {
      if (existingMovement.serviceOrderId !== serviceOrderId || existingMovement.osPartId !== osPartId) {
        throw new AppError('Chave de idempotência já utilizada para outra requisição', 409);
      }

      // Return existing result
      const part = await prismaClient.oSPart.findUnique({ where: { id: osPartId } });
      const stock = await prismaClient.stock.findFirst({
        where: { partId: part?.partId, companyId, branchId: existingMovement.branchId }
      });

      return {
        partId: osPartId,
        stockId: stock?.id || '',
        plannedQuantity: part?.quantity || 0,
        consumedQuantity: part?.consumedQuantity || 0,
        remainingQuantity: Math.max(0, (part?.quantity || 0) - (part?.consumedQuantity || 0)),
        availableStock: stock ? stock.quantity : 0,
        movements: [
          {
            id: existingMovement.id,
            quantity: existingMovement.quantity,
            performedById: existingMovement.userId,
            createdAt: existingMovement.createdAt
          }
        ]
      };
    }

    try {
      return await prismaClient.$transaction(async (tx) => {
        // Double check idempotency inside transaction to prevent race conditions
        const innerMovement = await tx.inventoryMovement.findUnique({
          where: { idempotencyKey }
        });
        if (innerMovement) {
          if (innerMovement.serviceOrderId !== serviceOrderId || innerMovement.osPartId !== osPartId) {
            throw new AppError('Chave de idempotência já utilizada para outra requisição', 409);
          }
          // Return
          const part = await tx.oSPart.findUnique({ where: { id: osPartId } });
          const stock = await tx.stock.findFirst({
            where: { partId: part?.partId, companyId, branchId: innerMovement.branchId }
          });
          return {
            partId: osPartId,
            stockId: stock?.id || '',
            plannedQuantity: part?.quantity || 0,
            consumedQuantity: part?.consumedQuantity || 0,
            remainingQuantity: Math.max(0, (part?.quantity || 0) - (part?.consumedQuantity || 0)),
            availableStock: stock ? stock.quantity : 0,
            movements: [
              {
                id: innerMovement.id,
                quantity: innerMovement.quantity,
                performedById: innerMovement.userId,
                createdAt: innerMovement.createdAt
              }
            ]
          };
        }

        // 2. Fetch OS & validate tenant
        const os = await tx.serviceOrder.findFirst({
          where: { id: serviceOrderId, companyId },
          include: { services: true }
        });

        if (!os) {
          throw new AppError('Ordem de Serviço não encontrada', 404);
        }

        if (os.status === 'FINISHED' || os.status === 'CANCELLED') {
          throw new AppError('Não é possível consumir peças de uma OS finalizada ou cancelada', 400);
        }

        // 3. Validate execution state: at least one service must be ASSIGNED, IN_PROGRESS, or PAUSED
        const hasExecutionActive = os.services.some((s) =>
          ['ASSIGNED', 'IN_PROGRESS', 'PAUSED'].includes(s.executionStatus)
        );

        if (!hasExecutionActive) {
          throw new AppError('O consumo de peças só é permitido após o início da execução da Ordem de Serviço', 400);
        }

        if (userRole === 'MECHANIC') {
          const isAssigned = os.services.some(
            (s) =>
              s.technicianId === userId &&
              ['ASSIGNED', 'IN_PROGRESS', 'PAUSED'].includes(s.executionStatus)
          );
          if (!isAssigned) {
            throw new AppError('Mecânicos só podem consumir peças de OS às quais estejam designados', 403);
          }
        }

        // 4. Validate latest active approval
        const latestApproval = await tx.serviceOrderApproval.findFirst({
          where: { serviceOrderId, companyId, status: 'APPROVED', invalidatedAt: null },
          orderBy: { version: 'desc' }
        });

        if (!latestApproval) {
          throw new AppError('A Ordem de Serviço precisa de um orçamento aprovado vigente', 400);
        }

        // 5. Validate OSPart
        const osPart = await tx.oSPart.findFirst({
          where: { id: osPartId, serviceOrderId }
        });

        if (!osPart) {
          throw new AppError('Peça planejada não encontrada nesta Ordem de Serviço', 404);
        }

        // 6. Validate against approval snapshot
        const snapshot = latestApproval.snapshot as any;
        const snapshotParts = snapshot?.parts || [];
        const snapshotPart = snapshotParts.find((p: any) => p.id === osPart.id);

        if (!snapshotPart) {
          throw new AppError('A peça solicitada não consta no snapshot do orçamento aprovado', 409);
        }

        // Confirm snapshot details match
        if (
          snapshotPart.quantity !== osPart.quantity.toString() ||
          new Prisma.Decimal(snapshotPart.unitPrice).toString() !== new Prisma.Decimal(osPart.unitPrice).toString()
        ) {
          throw new AppError('Divergência detectada entre os dados da peça e o snapshot aprovado', 409);
        }

        // 7. Validate quantities
        const remainingPlanned = osPart.quantity - osPart.consumedQuantity;
        if (quantity > remainingPlanned) {
          throw new AppError(`A quantidade solicitada (${quantity}) excede a quantidade planejada restante (${remainingPlanned})`, 400);
        }

        // 8. Fetch local stock and validate
        const stock = await tx.stock.findFirst({
          where: {
            partId: osPart.partId,
            companyId,
            branchId: os.branchId
          }
        });

        if (!stock || stock.quantity < quantity) {
          throw new AppError(`Saldo insuficiente em estoque. Disponível: ${stock ? stock.quantity : 0}`, 400);
        }

        // 9. Conditionally update OSPart.consumedQuantity
        const partUpdate = await tx.oSPart.updateMany({
          where: {
            id: osPartId,
            serviceOrderId,
            consumedQuantity: {
              lte: osPart.quantity - quantity
            }
          },
          data: {
            consumedQuantity: {
              increment: quantity
            }
          }
        });

        if (partUpdate.count !== 1) {
          throw new AppError('Conflito de concorrência: a quantidade planejada restante mudou', 409);
        }

        // 10. Conditionally update Stock.quantity
        const stockUpdate = await tx.stock.updateMany({
          where: {
            id: stock.id,
            companyId,
            branchId: os.branchId,
            quantity: {
              gte: quantity
            }
          },
          data: {
            quantity: {
              decrement: quantity
            }
          }
        });

        if (stockUpdate.count !== 1) {
          throw new AppError('Conflito de concorrência: saldo em estoque insuficiente ou alterado', 409);
        }

        // 11. Create InventoryMovement
        const movement = await tx.inventoryMovement.create({
          data: {
            partId: osPart.partId,
            branchId: os.branchId,
            userId,
            type: 'OUT',
            quantity,
            reason: 'SERVICE_ORDER_CONSUMPTION',
            serviceOrderId,
            osPartId,
            idempotencyKey
          }
        });

        const updatedPart = await tx.oSPart.findUnique({ where: { id: osPartId } });
        const updatedStock = await tx.stock.findUnique({ where: { id: stock.id } });

        return {
          partId: osPartId,
          stockId: stock.id,
          plannedQuantity: updatedPart?.quantity || 0,
          consumedQuantity: updatedPart?.consumedQuantity || 0,
          remainingQuantity: Math.max(0, (updatedPart?.quantity || 0) - (updatedPart?.consumedQuantity || 0)),
          availableStock: updatedStock ? updatedStock.quantity : 0,
          movements: [
            {
              id: movement.id,
              quantity: movement.quantity,
              performedById: movement.userId,
              createdAt: movement.createdAt
            }
          ]
        };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        // If unique constraint error for idempotencyKey happened concurrently
        const existingMovementConcurrent = await prismaClient.inventoryMovement.findUnique({
          where: { idempotencyKey }
        });
        if (existingMovementConcurrent) {
          if (existingMovementConcurrent.serviceOrderId !== serviceOrderId || existingMovementConcurrent.osPartId !== osPartId) {
            throw new AppError('Chave de idempotência já utilizada para outra requisição', 409);
          }
          const part = await prismaClient.oSPart.findUnique({ where: { id: osPartId } });
          const stock = await prismaClient.stock.findFirst({
            where: { partId: part?.partId, companyId, branchId: existingMovementConcurrent.branchId }
          });
          return {
            partId: osPartId,
            stockId: stock?.id || '',
            plannedQuantity: part?.quantity || 0,
            consumedQuantity: part?.consumedQuantity || 0,
            remainingQuantity: Math.max(0, (part?.quantity || 0) - (part?.consumedQuantity || 0)),
            availableStock: stock ? stock.quantity : 0,
            movements: [
              {
                id: existingMovementConcurrent.id,
                quantity: existingMovementConcurrent.quantity,
                performedById: existingMovementConcurrent.userId,
                createdAt: existingMovementConcurrent.createdAt
              }
            ]
          };
        }
      }
      throw error;
    }
  }
}
