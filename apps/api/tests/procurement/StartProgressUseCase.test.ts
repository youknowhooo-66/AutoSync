import { describe, it, expect, beforeEach } from 'vitest';
import { StartProgressUseCase } from '../../src/modules/procurement/useCases/StartProgressUseCase';
import { PrismaPurchaseRequestRepository } from '../../src/modules/procurement/repositories/PrismaPurchaseRequestRepository';
import { NotificationService } from '../../src/modules/procurement/services/NotificationService';
import { prismaClient as prisma } from '../../src/shared/database/prismaClient';

describe('StartProgressUseCase', () => {
  let repository: PrismaPurchaseRequestRepository;
  let notificationService: NotificationService;
  let useCase: StartProgressUseCase;

  let companyId: string;
  let branchId: string;
  let mechanicId: string;
  let financeId: string;
  let serviceOrderId: string;
  let requestId: string;

  beforeEach(async () => {
    repository = new PrismaPurchaseRequestRepository(prisma);
    notificationService = new NotificationService(prisma);
    useCase = new StartProgressUseCase(repository, notificationService, prisma);

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
        provisionalName: 'Sensor de Oxigênio Lambda',
        quantity: 1,
        requestedQuantity: 1,
        status: 'REQUESTED',
      },
    });
    requestId = pr.id;
  });

  it('should transition status from REQUESTED to IN_PROGRESS and record viewedById and event', async () => {
    const actor = { userId: financeId, companyId, branchId, role: 'FINANCIAL' };

    const result = await useCase.execute(requestId, actor);

    expect(result.status).toBe('IN_PROGRESS');
    expect(result.viewedById).toBe(financeId);

    const events = await prisma.purchaseRequestEvent.findMany({
      where: { purchaseRequestId: requestId },
    });
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('PROGRESS_STARTED');
  });

  it('should be idempotent if called again when already IN_PROGRESS', async () => {
    const actor = { userId: financeId, companyId, branchId, role: 'FINANCIAL' };
    await useCase.execute(requestId, actor);
    const secondCall = await useCase.execute(requestId, actor);

    expect(secondCall.status).toBe('IN_PROGRESS');
  });
});
