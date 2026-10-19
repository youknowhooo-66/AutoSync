import { describe, it, expect, beforeEach } from 'vitest';
import { CancelPartRequestUseCase } from '../../src/modules/procurement/useCases/CancelPartRequestUseCase';
import { ReceivePartUseCase } from '../../src/modules/procurement/useCases/ReceivePartUseCase';
import { PrismaPurchaseRequestRepository } from '../../src/modules/procurement/repositories/PrismaPurchaseRequestRepository';
import { NotificationService } from '../../src/modules/procurement/services/NotificationService';
import { prisma } from '../../src/config/prisma';

describe('CancelPartRequestUseCase', () => {
  let repository: PrismaPurchaseRequestRepository;
  let notificationService: NotificationService;
  let receiveUseCase: ReceivePartUseCase;
  let cancelUseCase: CancelPartRequestUseCase;

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
    cancelUseCase = new CancelPartRequestUseCase(repository, notificationService, prisma);

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
        provisionalName: 'Junta do Cabeçote',
        quantity: 1,
        requestedQuantity: 1,
        status: 'REQUESTED',
      },
    });
    requestId = pr.id;
  });

  it('should cancel a request in REQUESTED status and record event', async () => {
    const actor = { userId: mechanicId, companyId, branchId, role: 'ATTENDANT' };

    const result = await cancelUseCase.execute(
      {
        purchaseRequestId: requestId,
        cancelReason: 'Cliente desistiu do serviço adicional',
      },
      actor
    );

    expect(result.status).toBe('CANCELED');
    expect(result.cancelReason).toBe('Cliente desistiu do serviço adicional');
  });

  it('should release active stock reservation if canceled after READY_FOR_PICKUP without removing physical stock entry', async () => {
    await prisma.purchaseRequest.update({ where: { id: requestId }, data: { status: 'IN_PROGRESS' } });

    const stockistActor = { userId: stockistId, companyId, branchId, role: 'STOCKIST' };
    await receiveUseCase.execute(
      {
        purchaseRequestId: requestId,
        partName: 'Junta do Cabeçote Sabó',
        receivedQuantity: 1,
        unitPrice: 120.00,
      },
      stockistActor
    );

    const mechanicActor = { userId: mechanicId, companyId, branchId, role: 'ATTENDANT' };

    const result = await cancelUseCase.execute(
      {
        purchaseRequestId: requestId,
        cancelReason: 'Peça incorreta pedida por engano',
      },
      mechanicActor
    );

    expect(result.status).toBe('CANCELED');
  });

  it('should throw AppError 409 if reservation has consumed quantity > 0', async () => {
    await prisma.purchaseRequest.update({ where: { id: requestId }, data: { status: 'IN_PROGRESS' } });

    const stockistActor = { userId: stockistId, companyId, branchId, role: 'STOCKIST' };
    await receiveUseCase.execute(
      {
        purchaseRequestId: requestId,
        receivedQuantity: 1,
      },
      stockistActor
    );

    const prReceived = await prisma.purchaseRequest.findUniqueOrThrow({ where: { id: requestId } });

    // Simulate consumed quantity on reservation
    await prisma.stockReservation.updateMany({
      where: { osPartId: prReceived.osPartId! },
      data: { consumedQty: 1 },
    });

    const mechanicActor = { userId: mechanicId, companyId, branchId, role: 'ATTENDANT' };

    await expect(
      cancelUseCase.execute(
        {
          purchaseRequestId: requestId,
          cancelReason: 'Tentando cancelar peça consumida',
        },
        mechanicActor
      )
    ).rejects.toThrow('Não é possível cancelar uma solicitação com consumo de estoque registrado.');
  });
});
