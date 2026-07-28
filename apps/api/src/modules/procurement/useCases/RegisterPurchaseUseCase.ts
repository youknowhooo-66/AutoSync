import { PrismaClient, PurchaseRequest, Prisma } from '@prisma/client';
import { prisma as defaultPrisma } from '../../../config/prisma';
import { AppError } from '../../../shared/errors/AppError';
import { IPurchaseRequestRepository } from '../repositories/IPurchaseRequestRepository';
import { NotificationService } from '../services/NotificationService';
import { ActorContext } from './CreatePartRequestUseCase';

export type RegisterPurchaseDTO = {
  purchaseRequestId: string;
  definitiveName: string;
  suggestedInternalCode?: string;
  brand?: string;
  purchasedQuantity: number | string;
  unitPrice: number | string;
  supplierId: string;
  purchaseOrderRef?: string;
  expectedDeliveryAt?: Date | string;
  financialNote?: string;
};

export class RegisterPurchaseUseCase {
  constructor(
    private repository: IPurchaseRequestRepository,
    private notificationService: NotificationService = new NotificationService(),
    private prisma: PrismaClient = defaultPrisma
  ) {}

  async execute(dto: RegisterPurchaseDTO, actor: ActorContext): Promise<PurchaseRequest> {
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

    if (pr.status !== 'IN_PROGRESS') {
      throw new AppError(`Não é possível registrar compra para uma solicitação em status ${pr.status}. É necessário estar "Em andamento".`, 400);
    }

    if (!dto.definitiveName || dto.definitiveName.trim().length === 0) {
      throw new AppError('Nome definitivo da peça é obrigatório.', 400);
    }

    const qty = Number(dto.purchasedQuantity);
    if (isNaN(qty) || qty <= 0) {
      throw new AppError('Quantidade comprada deve ser um número positivo.', 400);
    }

    const price = Number(dto.unitPrice);
    if (isNaN(price) || price < 0) {
      throw new AppError('Preço unitário deve ser um valor válido não negativo.', 400);
    }

    if (!dto.supplierId) {
      throw new AppError('Fornecedor é obrigatório ao registrar a compra.', 400);
    }

    const supplier = await this.prisma.supplier.findFirst({
      where: { id: dto.supplierId, companyId: actor.companyId },
    });
    if (!supplier) {
      throw new AppError('Fornecedor informado não foi encontrado na empresa.', 404);
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedPr = await tx.purchaseRequest.update({
        where: { id: pr.id },
        data: {
          provisionalName: dto.definitiveName.trim(),
          purchasedQuantity: new Prisma.Decimal(qty),
          unitPrice: new Prisma.Decimal(price),
          supplierId: dto.supplierId,
          purchaseOrderRef: dto.purchaseOrderRef?.trim() || pr.purchaseOrderRef,
          expectedDeliveryAt: dto.expectedDeliveryAt ? new Date(dto.expectedDeliveryAt) : pr.expectedDeliveryAt,
          financialNote: dto.financialNote?.trim() || pr.financialNote,
          purchasedById: actor.userId,
          purchasedAt: new Date(),
          // Status stays IN_PROGRESS
        },
      });

      await this.repository.appendEvent(
        {
          companyId: actor.companyId,
          purchaseRequestId: pr.id,
          actorId: actor.userId,
          type: 'PURCHASE_REGISTERED',
          fromStatus: 'IN_PROGRESS',
          toStatus: 'IN_PROGRESS',
          notes: `Compra registrada. Peça: "${dto.definitiveName.trim()}", Qtd: ${qty}, Preço: R$ ${price.toFixed(2)}`,
          metadata: {
            definitiveName: dto.definitiveName.trim(),
            suggestedInternalCode: dto.suggestedInternalCode,
            brand: dto.brand,
            purchasedQuantity: qty,
            unitPrice: price,
            supplierId: dto.supplierId,
            purchaseOrderRef: dto.purchaseOrderRef,
            expectedDeliveryAt: dto.expectedDeliveryAt,
          },
        },
        tx
      );

      if (pr.createdBy) {
        await this.notificationService.notifyUser(
          {
            companyId: actor.companyId,
            recipientId: pr.createdBy,
            type: 'PURCHASE_REGISTERED',
            title: 'Compra de peça registrada',
            message: `A compra da peça "${updatedPr.provisionalName}" foi registrada. Previsão de entrega: ${dto.expectedDeliveryAt ? new Date(dto.expectedDeliveryAt).toLocaleDateString('pt-BR') : 'A definir'}.`,
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
