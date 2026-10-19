import { PurchaseRequest, PurchaseRequestStatus } from '@prisma/client';
import { AppError } from '../../../shared/errors/AppError';
import { prismaClient as defaultPrisma } from '../../../shared/database/prismaClient';
import { ActorContext } from './CreatePartRequestUseCase';

export type ListPartRequestsFilter = {
  serviceOrderId?: unknown;
  status?: unknown;
};

export class ListPartRequestsUseCase {
  constructor(private prisma: typeof defaultPrisma = defaultPrisma) {}

  async execute(filter: ListPartRequestsFilter, actor: ActorContext): Promise<PurchaseRequest[]> {
    const where: any = {
      companyId: actor.companyId,
      branchId: actor.branchId,
    };
    if (filter.serviceOrderId !== undefined) {
      if (typeof filter.serviceOrderId !== 'string') {
        throw new AppError('Filtro serviceOrderId inválido.', 400);
      }
      where.serviceOrderId = filter.serviceOrderId;
    }
    if (filter.status !== undefined) {
      if (!Object.values(PurchaseRequestStatus).includes(filter.status as PurchaseRequestStatus)) {
        throw new AppError('Filtro de status inválido.', 400);
      }
      where.status = filter.status;
    }

    return this.prisma.purchaseRequest.findMany({
      where,
      include: {
        createdByUser: { select: { id: true, name: true, email: true } },
        viewedByUser: { select: { id: true, name: true, email: true } },
        purchasedByUser: { select: { id: true, name: true, email: true } },
        receivedByUser: { select: { id: true, name: true, email: true } },
        installedByUser: { select: { id: true, name: true, email: true } },
        supplier: { select: { id: true, name: true } },
        part: { select: { id: true, name: true, internalCode: true } },
      },
      orderBy: { createdAt: 'desc' },
    }) as any;
  }
}
