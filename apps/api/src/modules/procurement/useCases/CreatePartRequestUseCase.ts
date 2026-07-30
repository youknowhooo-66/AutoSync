import { PrismaClient, PurchaseRequest, Prisma } from '@prisma/client';
import { prisma as defaultPrisma } from '../../../config/prisma';
import { AppError } from '../../../shared/errors/AppError';
import { IPurchaseRequestRepository } from '../repositories/IPurchaseRequestRepository';
import { NotificationService } from '../services/NotificationService';

export type ActorContext = {
  userId: string;
  companyId: string;
  branchId: string;
  role: string;
};

export type CreatePartRequestDTO = {
  serviceOrderId: string;
  provisionalName: string;
  requestedQuantity: number | string;
  mechanicNotes?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  expectedDeliveryAt?: Date | string;
};

export class CreatePartRequestUseCase {
  constructor(
    private repository: IPurchaseRequestRepository,
    private notificationService: NotificationService = new NotificationService(),
    private prisma: PrismaClient = defaultPrisma
  ) {}

  async execute(dto: CreatePartRequestDTO, actor: ActorContext): Promise<PurchaseRequest> {
    if (!dto.provisionalName || dto.provisionalName.trim().length === 0) {
      throw new AppError('Nome ou descrição da peça é obrigatório.', 400);
    }

    const qty = Number(dto.requestedQuantity);
    if (isNaN(qty) || qty <= 0) {
      throw new AppError('Quantidade solicitada deve ser um número positivo.', 400);
    }

    // Verify OS exists and belongs to actor's company & branch
    const os = await this.prisma.serviceOrder.findFirst({
      where: {
        id: dto.serviceOrderId,
        companyId: actor.companyId,
        branchId: actor.branchId,
      },
    });

    if (!os) {
      throw new AppError('Ordem de Serviço não encontrada na filial informada.', 404);
    }

    if (os.status === 'FINISHED' || os.status === 'CANCELLED') {
      throw new AppError('Não é possível solicitar peças para uma Ordem de Serviço finalizada ou cancelada.', 400);
    }

    return this.prisma.$transaction(async (tx) => {
      const pr = await tx.purchaseRequest.create({
        data: {
          companyId: actor.companyId,
          branchId: actor.branchId,
          serviceOrderId: dto.serviceOrderId,
          createdBy: actor.userId,
          provisionalName: dto.provisionalName.trim(),
          description: dto.provisionalName.trim(),
          quantity: new Prisma.Decimal(qty),
          requestedQuantity: new Prisma.Decimal(qty),
          priority: dto.priority || 'NORMAL',
          mechanicNotes: dto.mechanicNotes?.trim(),
          expectedDeliveryAt: dto.expectedDeliveryAt ? new Date(dto.expectedDeliveryAt) : null,
          status: 'REQUESTED',
        },
      });

      await this.repository.appendEvent(
        {
          companyId: actor.companyId,
          purchaseRequestId: pr.id,
          actorId: actor.userId,
          type: 'REQUEST_CREATED',
          toStatus: 'REQUESTED',
          notes: 'Solicitação de peça enviada pelo mecânico.',
          metadata: {
            provisionalName: dto.provisionalName,
            requestedQuantity: qty,
            priority: dto.priority || 'NORMAL',
          },
        },
        tx
      );

      await this.notificationService.notifyRoles(
        actor.companyId,
        actor.branchId,
        ['FINANCIAL', 'ADMIN', 'MANAGER'],
        {
          type: 'PART_REQUESTED',
          title: 'Nova solicitação de peça',
          message: `Mecânico solicitou a peça "${dto.provisionalName}" (${qty} un) na OS #${os.number}`,
          entityType: 'PurchaseRequest',
          entityId: pr.id,
        },
        tx
      );

      return pr;
    });
  }
}
