import { PurchaseRequest } from '@prisma/client';
import { prismaClient as defaultPrisma } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';
import { lockPurchaseRequestStatus } from '../repositories/lockPurchaseRequest';
import { IPurchaseRequestRepository } from '../repositories/IPurchaseRequestRepository';
import { NotificationService } from '../services/NotificationService';
import { ActorContext } from './CreatePartRequestUseCase';

export class StartProgressUseCase {
  constructor(
    private repository: IPurchaseRequestRepository,
    private notificationService: NotificationService = new NotificationService(),
    private prisma: typeof defaultPrisma = defaultPrisma
  ) {}

  async execute(purchaseRequestId: string, actor: ActorContext): Promise<PurchaseRequest> {
    const pr = await this.prisma.purchaseRequest.findFirst({
      where: {
        id: purchaseRequestId,
        companyId: actor.companyId,
        branchId: actor.branchId,
      },
    });

    if (!pr) {
      throw new AppError('Solicitação de peça não encontrada para o tenant/filial.', 404);
    }

    if (pr.status === 'CANCELED') {
      throw new AppError('Não é possível iniciar atendimento de uma solicitação cancelada.', 400);
    }

    // Idempotency check: if already IN_PROGRESS, record view if not yet set and return
    if (pr.status === 'IN_PROGRESS') {
      if (!pr.viewedById) {
        return this.prisma.purchaseRequest.update({
          where: { id: pr.id },
          data: { viewedById: actor.userId, viewedAt: new Date() },
        });
      }
      return pr;
    }

    if (pr.status !== 'REQUESTED') {
      throw new AppError(`Solicitação em estado inválido para atendimento (${pr.status}).`, 400);
    }

    return this.prisma.$transaction(async (tx) => {

      await lockPurchaseRequestStatus(tx, pr.id, pr.status);

      const updatedPr = await tx.purchaseRequest.update({
        where: { id: pr.id },
        data: {
          status: 'IN_PROGRESS',
          viewedById: actor.userId,
          viewedAt: new Date(),
        },
      });

      await this.repository.appendEvent(
        {
          companyId: actor.companyId,
          purchaseRequestId: pr.id,
          actorId: actor.userId,
          type: 'PROGRESS_STARTED',
          fromStatus: 'REQUESTED',
          toStatus: 'IN_PROGRESS',
          notes: 'Atendimento da solicitação de compra iniciado pelo financeiro.',
        },
        tx
      );

      if (pr.createdBy) {
        await this.notificationService.notifyUser(
          {
            companyId: actor.companyId,
            recipientId: pr.createdBy,
            type: 'PROGRESS_STARTED',
            title: 'Atendimento iniciado',
            message: `O setor financeiro iniciou o atendimento para a peça "${pr.provisionalName || pr.description}"`,
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
