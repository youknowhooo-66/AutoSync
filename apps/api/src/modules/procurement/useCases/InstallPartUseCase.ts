import { PrismaClient, PurchaseRequest, Prisma } from '@prisma/client';
import { prisma as defaultPrisma } from '../../../config/prisma';
import { AppError } from '../../../shared/errors/AppError';
import { IPurchaseRequestRepository } from '../repositories/IPurchaseRequestRepository';
import { NotificationService } from '../services/NotificationService';
import { ActorContext } from './CreatePartRequestUseCase';

export type InstallPartDTO = {
  purchaseRequestId: string;
  installedQuantity?: number | string;
};

export class InstallPartUseCase {
  constructor(
    private repository: IPurchaseRequestRepository,
    private notificationService: NotificationService = new NotificationService(),
    private prisma: PrismaClient = defaultPrisma
  ) {}

  async execute(dto: InstallPartDTO, actor: ActorContext): Promise<PurchaseRequest> {
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

    if (pr.status === 'INSTALLED') {
      return pr; // Idempotent
    }

    if (pr.status !== 'READY_FOR_PICKUP') {
      throw new AppError(`Não é possível instalar uma peça em status ${pr.status}. É necessário estar "Pronta para retirada".`, 400);
    }

    if (!pr.osPartId || !pr.stockId || !pr.partId) {
      throw new AppError('Solicitação não possui peça ou estoque vinculado.', 400);
    }

    const qtyToInstall = dto.installedQuantity ? Number(dto.installedQuantity) : Number(pr.requestedQuantity || pr.quantity);
    if (isNaN(qtyToInstall) || qtyToInstall <= 0) {
      throw new AppError('Quantidade a instalar inválida.', 400);
    }

    const idempotencyKey = `inst-${pr.id}`;

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Check idempotency on InventoryMovement
        const existingMovement = await tx.inventoryMovement.findUnique({
          where: { idempotencyKey },
        });

        if (existingMovement) {
          return tx.purchaseRequest.findUniqueOrThrow({ where: { id: pr.id } });
        }

        // Find Active Reservation
        const reservation = await tx.stockReservation.findFirst({
          where: {
            osPartId: pr.osPartId!,
            stockId: pr.stockId!,
            status: { in: ['ACTIVE', 'PARTIALLY_CONSUMED'] },
          },
        });

        if (!reservation) {
          throw new AppError('Reserva de estoque ativa não encontrada para esta peça.', 404);
        }

        const qtyDecimal = new Prisma.Decimal(qtyToInstall);
        const newConsumedQty = reservation.consumedQty.add(qtyDecimal);
        const isFullyConsumed = newConsumedQty.gte(reservation.quantity);
        const newReservationStatus = isFullyConsumed ? 'CONSUMED' : 'PARTIALLY_CONSUMED';

        // Update Reservation
        await tx.stockReservation.update({
          where: { id: reservation.id },
          data: {
            consumedQty: newConsumedQty,
            status: newReservationStatus,
            consumedAt: new Date(),
          },
        });

        // Update Stock
        await tx.stock.update({
          where: { id: pr.stockId! },
          data: {
            quantity: { decrement: qtyDecimal },
            reservedQuantity: { decrement: qtyDecimal },
          },
        });

        // Update OSPart.consumedQuantity
        const osPart = await tx.oSPart.update({
          where: { id: pr.osPartId! },
          data: {
            consumedQuantity: { increment: qtyDecimal },
          },
        });

        // InventoryMovement type OUT
        await tx.inventoryMovement.create({
          data: {
            partId: pr.partId!,
            branchId: pr.branchId,
            userId: actor.userId,
            type: 'OUT',
            quantity: qtyDecimal,
            reason: `Instalação de peça solicitada na OS (Solicitação: ${pr.id})`,
            serviceOrderId: pr.serviceOrderId,
            osPartId: osPart.id,
            idempotencyKey,
          },
        });

        // Update PurchaseRequest
        const updatedPr = await tx.purchaseRequest.update({
          where: { id: pr.id },
          data: {
            status: 'INSTALLED',
            installedById: actor.userId,
            installedAt: new Date(),
          },
        });

        await this.repository.appendEvent(
          {
            companyId: actor.companyId,
            purchaseRequestId: pr.id,
            actorId: actor.userId,
            type: 'PART_INSTALLED',
            fromStatus: 'READY_FOR_PICKUP',
            toStatus: 'INSTALLED',
            notes: `Peça instalada na OS pelo mecânico. Consumo de ${qtyToInstall} unidades registrado no estoque.`,
            metadata: {
              partId: pr.partId,
              stockId: pr.stockId,
              installedQuantity: qtyToInstall,
              reservationId: reservation.id,
            },
          },
          tx
        );

        await this.notificationService.notifyRoles(
          actor.companyId,
          pr.branchId,
          ['FINANCIAL', 'STOCKIST', 'ADMIN', 'MANAGER'],
          {
            type: 'PART_INSTALLED',
            title: 'Instalação de peça confirmada',
            message: `A peça solicitada para a OS foi instalada pelo mecânico. Baixa de ${qtyToInstall} un registrada.`,
            entityType: 'PurchaseRequest',
            entityId: pr.id,
          },
          tx
        );

        return updatedPr;
      });
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return this.prisma.purchaseRequest.findFirstOrThrow({
          where: { id: pr.id, companyId: actor.companyId, branchId: actor.branchId },
        });
      }
      throw error;
    }
  }
}
