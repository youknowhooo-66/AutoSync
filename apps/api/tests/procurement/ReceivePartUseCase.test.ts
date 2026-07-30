import { describe, it, expect, beforeEach } from 'vitest';
import { ReceivePartUseCase } from '../../src/modules/procurement/useCases/ReceivePartUseCase';
import { PrismaPurchaseRequestRepository } from '../../src/modules/procurement/repositories/PrismaPurchaseRequestRepository';
import { NotificationService } from '../../src/modules/procurement/services/NotificationService';
import { prisma } from '../../src/config/prisma';

describe('ReceivePartUseCase', () => {
  let repository: PrismaPurchaseRequestRepository;
  let notificationService: NotificationService;
  let useCase: ReceivePartUseCase;

  let companyId: string;
  let branchId: string;
  let mechanicId: string;
  let stockistId: string;
  let serviceOrderId: string;
  let requestId: string;

  beforeEach(async () => {
    repository = new PrismaPurchaseRequestRepository(prisma);
    notificationService = new NotificationService(prisma);
    useCase = new ReceivePartUseCase(repository, notificationService, prisma);

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

    const stockist = await prisma.user.create({
      data: { companyId, branchId, name: 'Stockist User', email: `stk-${Date.now()}@test.com`, password: 'hash', role: 'STOCKIST' },
    });
    stockistId = stockist.id;

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
        provisionalName: 'Correia Dentada 120D',
        quantity: 2,
        requestedQuantity: 2,
        purchasedQuantity: 5,
        unitPrice: 45.00,
        status: 'IN_PROGRESS',
      },
    });
    requestId = pr.id;
  });

  it('should execute physical receipt: create Part, Stock (+5 entry, +2 reserved), InventoryMovement IN, OSPart, and StockReservation', async () => {
    const actor = { userId: stockistId, companyId, branchId, role: 'STOCKIST' };

    const result = await useCase.execute(
      {
        purchaseRequestId: requestId,
        partName: 'Correia Dentada Continental 120D',
        receivedQuantity: 5,
        unitPrice: 45.00,
      },
      actor
    );

    expect(result.status).toBe('READY_FOR_PICKUP');
    expect(result.partId).toBeDefined();

    const part = await prisma.part.findUnique({ where: { id: result.partId! } });
    expect(part!.name).toBe('Correia Dentada Continental 120D');

    const stock = await prisma.stock.findUnique({ where: { id: result.stockId! } });
    expect(Number(stock!.quantity)).toBe(5);
    expect(Number(stock!.reservedQuantity)).toBe(2);
  });

  it('should throw AppError if receivedQuantity is less than requestedQuantity', async () => {
    const actor = { userId: stockistId, companyId, branchId, role: 'STOCKIST' };

    await expect(
      useCase.execute(
        {
          purchaseRequestId: requestId,
          receivedQuantity: 1, // Requested 2, received 1
        },
        actor
      )
    ).rejects.toThrow('A quantidade recebida é inferior à quantidade solicitada para a OS.');
  });

  it('should be idempotent: calling receive twice with same ID does not duplicate stock entries', async () => {
    const actor = { userId: stockistId, companyId, branchId, role: 'STOCKIST' };

    await useCase.execute({ purchaseRequestId: requestId }, actor);
    const secondCall = await useCase.execute({ purchaseRequestId: requestId }, actor);

    expect(secondCall.status).toBe('READY_FOR_PICKUP');
  });
});
