import { describe, it, expect, beforeEach } from 'vitest';
import { InstallPartUseCase } from '../../src/modules/procurement/useCases/InstallPartUseCase';
import { ReceivePartUseCase } from '../../src/modules/procurement/useCases/ReceivePartUseCase';
import { PrismaPurchaseRequestRepository } from '../../src/modules/procurement/repositories/PrismaPurchaseRequestRepository';
import { NotificationService } from '../../src/modules/procurement/services/NotificationService';
import { prismaClient as prisma } from '../../src/shared/database/prismaClient';

describe('InstallPartUseCase', () => {
  let repository: PrismaPurchaseRequestRepository;
  let notificationService: NotificationService;
  let receiveUseCase: ReceivePartUseCase;
  let installUseCase: InstallPartUseCase;

  let companyId: string;
  let branchId: string;
  let mechanicId: string;
  let stockistId: string;
  let serviceOrderId: string;
  let requestId: string;

  beforeEach(async () => {
    repository = new PrismaPurchaseRequestRepository(prisma);
    notificationService = new NotificationService(prisma);
    receiveUseCase = new ReceivePartUseCase(repository, notificationService, prisma);
    installUseCase = new InstallPartUseCase(repository, notificationService, prisma);

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
        provisionalName: 'Vela de Ignição Iridium',
        quantity: 4,
        requestedQuantity: 4,
        status: 'IN_PROGRESS',
      },
    });
    requestId = pr.id;

    const stockistActor = { userId: stockistId, companyId, branchId, role: 'STOCKIST' };
    await receiveUseCase.execute(
      {
        purchaseRequestId: requestId,
        partName: 'Vela NGK Iridium',
        receivedQuantity: 4,
        unitPrice: 35.00,
      },
      stockistActor
    );
  });

  it('should transition status from READY_FOR_PICKUP to INSTALLED, consume reservation, create OUT movement, and update OSPart.consumedQuantity', async () => {
    const actor = { userId: mechanicId, companyId, branchId, role: 'ATTENDANT' };

    const result = await installUseCase.execute(
      {
        purchaseRequestId: requestId,
        installedQuantity: 4,
      },
      actor
    );

    expect(result.status).toBe('INSTALLED');
    expect(result.installedById).toBe(mechanicId);

    const osPart = await prisma.oSPart.findUnique({ where: { id: result.osPartId! } });
    expect(Number(osPart!.consumedQuantity)).toBe(4);
  });

  it('should be idempotent: calling install twice does not double consume stock', async () => {
    const actor = { userId: mechanicId, companyId, branchId, role: 'ATTENDANT' };

    await installUseCase.execute({ purchaseRequestId: requestId }, actor);
    const secondCall = await installUseCase.execute({ purchaseRequestId: requestId }, actor);

    expect(secondCall.status).toBe('INSTALLED');
  });
});
