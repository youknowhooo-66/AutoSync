import { PrismaClient, PurchaseRequest, PurchaseRequestEvent, Prisma } from '@prisma/client';
import { prisma as defaultPrisma } from '../../../config/prisma';
import { IPurchaseRequestRepository, CreatePurchaseRequestData } from './IPurchaseRequestRepository';

export class PrismaPurchaseRequestRepository implements IPurchaseRequestRepository {
  constructor(private prisma: PrismaClient = defaultPrisma) {}

  async findById(id: string, companyId: string): Promise<PurchaseRequest | null> {
    return this.prisma.purchaseRequest.findFirst({
      where: { id, companyId },
    });
  }

  async findWithDetails(id: string, companyId: string): Promise<(PurchaseRequest & { events: PurchaseRequestEvent[] }) | null> {
    return this.prisma.purchaseRequest.findFirst({
      where: { id, companyId },
      include: {
        events: {
          orderBy: { occurredAt: 'desc' },
        },
      },
    }) as any;
  }

  async findMany(filter: { companyId: string; branchId?: string; serviceOrderId?: string; status?: string }): Promise<PurchaseRequest[]> {
    const where: Prisma.PurchaseRequestWhereInput = {
      companyId: filter.companyId,
    };
    if (filter.branchId) where.branchId = filter.branchId;
    if (filter.serviceOrderId) where.serviceOrderId = filter.serviceOrderId;
    if (filter.status) where.status = filter.status as any;

    return this.prisma.purchaseRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: CreatePurchaseRequestData): Promise<PurchaseRequest> {
    return this.prisma.purchaseRequest.create({
      data: {
        companyId: data.companyId,
        branchId: data.branchId,
        serviceOrderId: data.serviceOrderId,
        createdBy: data.createdBy,
        provisionalName: data.provisionalName,
        description: data.provisionalName,
        quantity: new Prisma.Decimal(data.requestedQuantity),
        requestedQuantity: new Prisma.Decimal(data.requestedQuantity),
        priority: data.priority || 'NORMAL',
        mechanicNotes: data.mechanicNotes,
        expectedDeliveryAt: data.expectedDeliveryAt,
        status: 'REQUESTED',
      },
    });
  }

  async update(id: string, companyId: string, data: Prisma.PurchaseRequestUpdateInput): Promise<PurchaseRequest> {
    return this.prisma.purchaseRequest.update({
      where: { id },
      data,
    });
  }

  async appendEvent(
    data: {
      companyId: string;
      purchaseRequestId: string;
      actorId: string;
      type: string;
      fromStatus?: any;
      toStatus?: any;
      notes?: string;
      metadata?: any;
    },
    tx?: Prisma.TransactionClient
  ): Promise<PurchaseRequestEvent> {
    const client = tx || this.prisma;
    return client.purchaseRequestEvent.create({
      data: {
        companyId: data.companyId,
        purchaseRequestId: data.purchaseRequestId,
        actorId: data.actorId,
        type: data.type,
        fromStatus: data.fromStatus,
        toStatus: data.toStatus,
        notes: data.notes,
        metadata: data.metadata ?? Prisma.DbNull,
      },
    });
  }
}
