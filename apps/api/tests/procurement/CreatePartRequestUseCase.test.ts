import { describe, it, expect, beforeEach } from 'vitest';
import { CreatePartRequestUseCase } from '../../src/modules/procurement/useCases/CreatePartRequestUseCase';
import { PrismaPurchaseRequestRepository } from '../../src/modules/procurement/repositories/PrismaPurchaseRequestRepository';
import { NotificationService } from '../../src/modules/procurement/services/NotificationService';
import { prisma } from '../../src/config/prisma';

describe('CreatePartRequestUseCase', () => {
  let repository: PrismaPurchaseRequestRepository;
  let notificationService: NotificationService;
  let useCase: CreatePartRequestUseCase;

  let companyId: string;
  let branchId: string;
  let userId: string;
  let serviceOrderId: string;

  beforeEach(async () => {
    repository = new PrismaPurchaseRequestRepository(prisma);
    notificationService = new NotificationService(prisma);
    useCase = new CreatePartRequestUseCase(repository, notificationService, prisma);

    const comp = await prisma.company.create({
      data: { name: 'Test Corp', document: `DOC-${Date.now()}-${Math.random()}` },
    });
    companyId = comp.id;

    const branch = await prisma.branch.create({
      data: { companyId, name: 'Branch 1', cnpj: `CNPJ-${Date.now()}-${Math.random()}` },
    });
    branchId = branch.id;

    const user = await prisma.user.create({
      data: {
        companyId,
        branchId,
        name: 'Mechanic User',
        email: `mechanic-${Date.now()}-${Math.random()}@test.com`,
        password: 'hash',
        role: 'ATTENDANT',
      },
    });
    userId = user.id;

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
  });

  it('should create a PurchaseRequest with status REQUESTED without creating Part or Stock', async () => {
    const actor = { userId, companyId, branchId, role: 'ATTENDANT' };

    const result = await useCase.execute(
      {
        serviceOrderId,
        provisionalName: 'Filtro de Óleo Específic High-Performance',
        requestedQuantity: 2,
        priority: 'URGENT',
        mechanicNotes: 'Verificar compatibilidade com motor 1.5 3 cilindros',
      },
      actor
    );

    expect(result).toBeDefined();
    expect(result.status).toBe('REQUESTED');
    expect(result.provisionalName).toBe('Filtro de Óleo Específic High-Performance');
    expect(Number(result.quantity)).toBe(2);
    expect(result.priority).toBe('URGENT');
    expect(result.partId).toBeNull();
    expect(result.stockId).toBeNull();

    const events = await prisma.purchaseRequestEvent.findMany({
      where: { purchaseRequestId: result.id },
    });
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('REQUEST_CREATED');
  });

  it('should throw AppError if provisionalName is missing or quantity is invalid', async () => {
    const actor = { userId, companyId, branchId, role: 'ATTENDANT' };

    await expect(
      useCase.execute(
        {
          serviceOrderId,
          provisionalName: '',
          requestedQuantity: 2,
        },
        actor
      )
    ).rejects.toThrow('Nome ou descrição da peça é obrigatório.');

    await expect(
      useCase.execute(
        {
          serviceOrderId,
          provisionalName: 'Pastilha',
          requestedQuantity: 0,
        },
        actor
      )
    ).rejects.toThrow('Quantidade solicitada deve ser um número positivo.');
  });
});
