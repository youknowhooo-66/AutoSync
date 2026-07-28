import { PrismaClient, PurchaseRequest } from '@prisma/client';
import { prisma as defaultPrisma } from '../../../config/prisma';
import { ActorContext } from './CreatePartRequestUseCase';

export type ListPartRequestsFilter = {
  serviceOrderId?: string;
  status?: string;
};

export class ListPartRequestsUseCase {
  constructor(private prisma: PrismaClient = defaultPrisma) {}

  async execute(filter: ListPartRequestsFilter, actor: ActorContext): Promise<PurchaseRequest[]> {
    const where: any = {
      companyId: actor.companyId,
      branchId: actor.branchId,
    };
    if (filter.serviceOrderId) where.serviceOrderId = filter.serviceOrderId;
    if (filter.status) where.status = filter.status;

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
