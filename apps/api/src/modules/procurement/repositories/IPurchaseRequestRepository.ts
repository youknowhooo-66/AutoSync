import { PurchaseRequest, PurchaseRequestEvent, Prisma } from '@prisma/client';

export type CreatePurchaseRequestData = {
  companyId: string;
  branchId: string;
  serviceOrderId: string;
  createdBy: string;
  provisionalName: string;
  requestedQuantity: Prisma.Decimal | number;
  priority?: string;
  mechanicNotes?: string;
  expectedDeliveryAt?: Date;
};

export interface IPurchaseRequestRepository {
  findById(id: string, companyId: string): Promise<PurchaseRequest | null>;
  findWithDetails(id: string, companyId: string): Promise<(PurchaseRequest & { events: PurchaseRequestEvent[] }) | null>;
  findMany(filter: { companyId: string; branchId?: string; serviceOrderId?: string; status?: string }): Promise<PurchaseRequest[]>;
  create(data: CreatePurchaseRequestData): Promise<PurchaseRequest>;
  update(id: string, companyId: string, data: Prisma.PurchaseRequestUpdateInput): Promise<PurchaseRequest>;
  appendEvent(
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
  ): Promise<PurchaseRequestEvent>;
}
