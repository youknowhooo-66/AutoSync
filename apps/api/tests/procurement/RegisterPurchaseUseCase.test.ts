import { describe, it, expect, beforeEach } from 'vitest';
import { RegisterPurchaseUseCase } from '../../src/modules/procurement/useCases/RegisterPurchaseUseCase';
import { PrismaPurchaseRequestRepository } from '../../src/modules/procurement/repositories/PrismaPurchaseRequestRepository';
import { NotificationService } from '../../src/modules/procurement/services/NotificationService';
import { prismaClient as prisma } from '../../src/shared/database/prismaClient';

describe('RegisterPurchaseUseCase', () => {
  let repository: PrismaPurchaseRequestRepository;
  let notificationService: NotificationService;
  let useCase: RegisterPurchaseUseCase;

  let companyId: string;
  let branchId: string;
  let mechanicId: string;
  let financeId: string;
  let supplierId: string;
  let serviceOrderId: string;
  let requestId: string;

  beforeEach(async () => {
    repository = new PrismaPurchaseRequestRepository(prisma);
    notificationService = new NotificationService(prisma);
    useCase = new RegisterPurchaseUseCase(repository, notificationService, prisma);

    const comp = await prisma.company.create({
      data: { name: 'Test Corp', document: `DOC-${Date.now()}-${Math.random()}` },
    });
    companyId = comp.id;

    const branch = await prisma.branch.create({
      data: { companyId, name: 'Branch 1', cnpj: `CNPJ-${Date.now()}-${Math.random()}` },
    });
    branchId = branch.id;

    const mechanic = await prisma.user.create({
      data: { companyId, branchId, name: 'Mechanic', email: `mech-${Date.now()}@test.com`, password: 'hash', role: 'ATTENDANT' },
    });
    mechanicId = mechanic.id;

    const finance = await prisma.user.create({
      data: { companyId, branchId, name: 'Finance User', email: `fin-${Date.now()}@test.com`, password: 'hash', role: 'FINANCIAL' },
    });
    financeId = finance.id;

    const supplier = await prisma.supplier.create({
      data: { companyId, name: 'Supplier AutoParts', cnpj: `CNPJ-SUP-${Date.now()}` },
    });
    supplierId = supplier.id;

    const client = await prisma.client.create({
      data: { companyId, name: 'Client A', document: `DOC-${Date.now()}` },
    });

    const vehicle = await prisma.vehicle.create({
      data: { companyId, clientId: client.id, plate: `PLT-${Date.now()}`, brand: 'Ford', model: 'Ka', year: 2020 },
    });

    const os = await prisma.serviceOrder.create({
      data: { companyId, branchId, clientId: client.id, vehicleId: vehicle.id, status: 'OPEN' },
    });
    serviceOrderId = os.id;

    const pr = await prisma.purchaseRequest.create({
      data: {
        companyId,
        branchId,
        serviceOrderId,
        createdBy: mechanicId,
        provisionalName: 'Amortecedor Dianteiro Provisório',
        quantity: 2,
        requestedQuantity: 2,
        status: 'IN_PROGRESS',
      },
    });
    requestId = pr.id;
  });

  it('should update PurchaseRequest with definitiveName and purchase details while keeping status IN_PROGRESS without creating Part or Stock', async () => {
    const actor = { userId: financeId, companyId, branchId, role: 'FINANCIAL' };

    const result = await useCase.execute(
      {
        purchaseRequestId: requestId,
        definitiveName: 'Amortecedor Dianteiro Cofap Turbo Gas',
        suggestedInternalCode: 'PEC-2026-CF102',
        brand: 'Cofap',
        purchasedQuantity: 4,
        unitPrice: 150.00,
        supplierId,
        purchaseOrderRef: 'NF-998811',
        expectedDeliveryAt: new Date(Date.now() + 86400000),
        financialNote: 'Comprado lote com desconto',
      },
      actor
    );

    expect(result.status).toBe('IN_PROGRESS');
    expect(result.provisionalName).toBe('Amortecedor Dianteiro Cofap Turbo Gas');
    expect(Number(result.purchasedQuantity)).toBe(4);
    expect(Number(result.unitPrice)).toBe(150.00);
    expect(result.supplierId).toBe(supplierId);
    expect(result.purchasedById).toBe(financeId);

    const events = await prisma.purchaseRequestEvent.findMany({
      where: { purchaseRequestId: requestId },
    });
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('PURCHASE_REGISTERED');
  });
});
