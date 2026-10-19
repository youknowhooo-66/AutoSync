import { PurchaseRequest, Prisma } from '@prisma/client';
import crypto from 'crypto';
import { prismaClient as defaultPrisma } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';
import { lockPurchaseRequestStatus } from '../repositories/lockPurchaseRequest';
import { IPurchaseRequestRepository } from '../repositories/IPurchaseRequestRepository';
import { NotificationService } from '../services/NotificationService';
import { ActorContext } from './CreatePartRequestUseCase';

export type ReceivePartDTO = {
  purchaseRequestId: string;
  partName?: string;
  internalCode?: string;
  brand?: string;
  receivedQuantity?: number | string;
  unitPrice?: number | string;
};

export class ReceivePartUseCase {
  constructor(
    private repository: IPurchaseRequestRepository,
    private notificationService: NotificationService = new NotificationService(),
    private prisma: typeof defaultPrisma = defaultPrisma
  ) {}

  private generateInternalCode(): string {
    const year = new Date().getFullYear();
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `PEC-${year}-${randomHex}`;
  }

  async execute(dto: ReceivePartDTO, actor: ActorContext): Promise<PurchaseRequest> {
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

    if (pr.status === 'READY_FOR_PICKUP') {
      return pr; // Idempotent
    }

    if (pr.status !== 'IN_PROGRESS') {
      throw new AppError(`Não é possível receber peças para uma solicitação em status ${pr.status}. É necessário estar "Em andamento".`, 400);
    }

    const qtyToReceive = dto.receivedQuantity ? Number(dto.receivedQuantity) : Number(pr.purchasedQuantity || pr.requestedQuantity || pr.quantity);
    if (isNaN(qtyToReceive) || qtyToReceive <= 0) {
      throw new AppError('Quantidade recebida inválida.', 400);
    }

    const requestedQtyDecimal = pr.requestedQuantity || pr.quantity;
    if (new Prisma.Decimal(qtyToReceive).lt(requestedQtyDecimal)) {
      throw new AppError('A quantidade recebida é inferior à quantidade solicitada para a OS.', 400);
    }

    const price = dto.unitPrice !== undefined ? Number(dto.unitPrice) : Number(pr.unitPrice || pr.estimatedUnitCost || 0);
    if (isNaN(price) || price < 0) {
      throw new AppError('Preço unitário inválido.', 400);
    }

    const nameToUse = (dto.partName || pr.provisionalName || pr.description || 'Peça Solicitada').trim();
    const idempotencyKey = `recv-${pr.id}`;

    try {
      return await this.prisma.$transaction(async (tx) => {
        await lockPurchaseRequestStatus(tx, pr.id, pr.status);

        // Check idempotency on InventoryMovement
        const existingMovement = await tx.inventoryMovement.findUnique({
          where: { idempotencyKey },
        });

        if (existingMovement) {
          return tx.purchaseRequest.findUniqueOrThrow({ where: { id: pr.id } });
        }

        // Internal code generation
        let codeToUse = dto.internalCode?.trim().toUpperCase();
        if (!codeToUse) {
          let isUnique = false;
          let attempts = 0;
          while (!isUnique && attempts < 5) {
            codeToUse = this.generateInternalCode();
            const normalized = codeToUse.toLowerCase();
            const existing = await tx.part.findFirst({
              where: { companyId: actor.companyId, normalizedInternalCode: normalized },
            });
            if (!existing) {
              isUnique = true;
            }
            attempts++;
          }
        }

        const normalizedCode = codeToUse!.toLowerCase();

        // Upsert Part
        let part = await tx.part.findFirst({
          where: { companyId: actor.companyId, normalizedInternalCode: normalizedCode },
        });

        if (!part) {
          part = await tx.part.create({
            data: {
              companyId: actor.companyId,
              internalCode: codeToUse,
              normalizedInternalCode: normalizedCode,
              name: nameToUse,
              brand: dto.brand?.trim() || null,
              purchasePrice: new Prisma.Decimal(price),
              salePrice: new Prisma.Decimal(price),
              active: true,
            },
          });
        }

        // Upsert Stock for Branch
        let stock = await tx.stock.findUnique({
          where: { partId_branchId: { partId: part.id, branchId: pr.branchId } },
        });

        if (!stock) {
          stock = await tx.stock.create({
            data: {
              companyId: actor.companyId,
              branchId: pr.branchId,
              partId: part.id,
              quantity: new Prisma.Decimal(qtyToReceive),
              reservedQuantity: new Prisma.Decimal(requestedQtyDecimal),
              averageCost: new Prisma.Decimal(price),
            },
          });
        } else {
          stock = await tx.stock.update({
            where: { id: stock.id },
            data: {
              quantity: { increment: new Prisma.Decimal(qtyToReceive) },
              reservedQuantity: { increment: new Prisma.Decimal(requestedQtyDecimal) },
              averageCost: new Prisma.Decimal(price),
            },
          });
        }

        // Upsert OSPart
        let osPart = pr.osPartId
          ? await tx.oSPart.findUnique({ where: { id: pr.osPartId } })
          : null;

        if (!osPart) {
          osPart = await tx.oSPart.create({
            data: {
              serviceOrderId: pr.serviceOrderId,
              partId: part.id,
              description: nameToUse,
              quantity: new Prisma.Decimal(requestedQtyDecimal),
              unitPrice: new Prisma.Decimal(price),
              supplySource: 'PURCHASE',
            },
          });
        } else {
          osPart = await tx.oSPart.update({
            where: { id: osPart.id },
            data: {
              partId: part.id,
              unitPrice: new Prisma.Decimal(price),
              description: nameToUse,
              supplySource: 'PURCHASE',
            },
          });
        }

        // InventoryMovement type IN
        await tx.inventoryMovement.create({
          data: {
            partId: part.id,
            branchId: pr.branchId,
            userId: actor.userId,
            type: 'IN',
            quantity: new Prisma.Decimal(qtyToReceive),
            reason: `Recebimento físico de compra para OS (Solicitação: ${pr.id})`,
            serviceOrderId: pr.serviceOrderId,
            osPartId: osPart.id,
            idempotencyKey,
          },
        });

        // StockReservation
        const reservation = await tx.stockReservation.create({
          data: {
            companyId: actor.companyId,
            branchId: pr.branchId,
            stockId: stock.id,
            serviceOrderId: pr.serviceOrderId,
            osPartId: osPart.id,
            purchaseRequestId: pr.id,
            quantity: new Prisma.Decimal(requestedQtyDecimal),
            status: 'ACTIVE',
          },
        });

        // Update PurchaseRequest
        const updatedPr = await tx.purchaseRequest.update({
          where: { id: pr.id },
          data: {
            partId: part.id,
            stockId: stock.id,
            osPartId: osPart.id,
            status: 'READY_FOR_PICKUP',
            receivedById: actor.userId,
            receivedAt: new Date(),
            readyForPickupAt: new Date(),
            unitPrice: new Prisma.Decimal(price),
          },
        });

        await this.repository.appendEvent(
          {
            companyId: actor.companyId,
            purchaseRequestId: pr.id,
            actorId: actor.userId,
            type: 'PART_RECEIVED',
            fromStatus: 'IN_PROGRESS',
            toStatus: 'READY_FOR_PICKUP',
            notes: `Peça recebida fisicamente e estocada. Entrada de +${qtyToReceive} em estoque, ${requestedQtyDecimal} reservado para a OS.`,
            metadata: {
              partId: part.id,
              internalCode: part.internalCode,
              stockId: stock.id,
              receivedQuantity: qtyToReceive,
              reservedQuantity: requestedQtyDecimal,
              unitPrice: price,
              reservationId: reservation.id,
            },
          },
          tx
        );

        if (pr.createdBy) {
          await this.notificationService.notifyUser(
            {
              companyId: actor.companyId,
              recipientId: pr.createdBy,
              type: 'PART_READY_FOR_PICKUP',
              title: 'Peça pronta para retirada',
              message: `A peça "${part.name}" (${codeToUse}) chegou e está reservada para a OS. Pronta para instalação.`,
              entityType: 'PurchaseRequest',
              entityId: pr.id,
            },
            tx
          );
        }

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
