import { PrismaClient, PurchaseRequest } from '@prisma/client';
import { prisma as defaultPrisma } from '../../../config/prisma';
import { AppError } from '../../../shared/errors/AppError';
import { IPurchaseRequestRepository } from '../repositories/IPurchaseRequestRepository';
import { NotificationService } from '../services/NotificationService';
import { ActorContext } from './CreatePartRequestUseCase';

export type CancelPartRequestDTO = {
  purchaseRequestId: string;
  cancelReason: string;
};

export class CancelPartRequestUseCase {
  constructor(
    private repository: IPurchaseRequestRepository,
    private notificationService: NotificationService = new NotificationService(),
    private prisma: PrismaClient = defaultPrisma
  ) {}

  async execute(dto: CancelPartRequestDTO, actor: ActorContext): Promise<PurchaseRequest> {
    const pr = await this.prisma.purchaseRequest.findFirst({
      where: {
        id: dto.purchaseRequestId,
        companyId: actor.companyId,
        branchId: actor.branchId,
      },
    });

    if (!pr) {
      throw new AppError('Solicitação de peça não encontrada para o tenant/filial.', 404);
    }

    if (pr.status === 'CANCELED') {
      return pr; // Idempotent
    }

    if (pr.status === 'INSTALLED') {
      throw new AppError('Não é possível cancelar uma solicitação de peça já instalada na Ordem de Serviço.', 400);
    }

    if (!dto.cancelReason || dto.cancelReason.trim().length === 0) {
      throw new AppError('Motivo do cancelamento é obrigatório.', 400);
    }

    return this.prisma.$transaction(async (tx) => {
      // Check if reservation has any consumed quantity
      if (pr.osPartId && pr.stockId) {
        const reservation = await tx.stockReservation.findFirst({
          where: {
            osPartId: pr.osPartId,
            stockId: pr.stockId,
          },
        });

        if (reservation && reservation.consumedQty.gt(0)) {
          throw new AppError('Não é possível cancelar uma solicitação com consumo de estoque registrado.', 409);
        }

        if (reservation && (reservation.status === 'ACTIVE' || reservation.status === 'PARTIALLY_CONSUMED')) {
          const unconsumedQty = reservation.quantity.sub(reservation.consumedQty);

          await tx.stockReservation.update({
            where: { id: reservation.id },
            data: {
              status: 'RELEASED',
              releasedQty: unconsumedQty,
              releasedAt: new Date(),
            },
          });

          await tx.stock.update({
            where: { id: pr.stockId },
            data: {
              reservedQuantity: { decrement: unconsumedQty },
            },
          });
        }
      }

      const updatedPr = await tx.purchaseRequest.update({
        where: { id: pr.id },
        data: {
          status: 'CANCELED',
          canceledById: actor.userId,
          canceledAt: new Date(),
          cancelReason: dto.cancelReason.trim(),
        },
      });

      await this.repository.appendEvent(
        {
          companyId: actor.companyId,
          purchaseRequestId: pr.id,
          actorId: actor.userId,
          type: 'REQUEST_CANCELED',
          fromStatus: pr.status,
          toStatus: 'CANCELED',
          notes: `Solicitação cancelada. Motivo: ${dto.cancelReason.trim()}`,
          metadata: {
            cancelReason: dto.cancelReason,
            previousStatus: pr.status,
          },
        },
        tx
      );

      if (pr.createdBy && pr.createdBy !== actor.userId) {
        await this.notificationService.notifyUser(
          {
            companyId: actor.companyId,
            recipientId: pr.createdBy,
            type: 'REQUEST_CANCELED',
            title: 'Solicitação de peça cancelada',
            message: `A solicitação para "${pr.provisionalName || pr.description}" foi cancelada. Motivo: ${dto.cancelReason.trim()}`,
            entityType: 'PurchaseRequest',
            entityId: pr.id,
          },
          tx
        );
      }

      return updatedPr;
    });
  }
}
