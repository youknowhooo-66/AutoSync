import request from 'supertest';
import app from '../app';
import { prismaClient } from '../shared/database/prismaClient';
import jwt from 'jsonwebtoken';

const mockPrisma = vi.hoisted(() => {
  const m = {
    serviceOrder: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      groupBy: vi.fn(),
    },
    oSService: {
      createMany: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    oSPart: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    stock: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    part: {
      findUnique: vi.fn(),
    },
    inventoryMovement: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    serviceOrderApproval: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    financialRecord: {
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    branch: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    client: {
      findFirst: vi.fn(),
    },
    vehicle: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn().mockImplementation(async (cb) => cb(m)),
  };
  return m;
});

vi.mock('../shared/database/prismaClient', () => ({
  prismaClient: mockPrisma,
  PrismaClient: vi.fn().mockImplementation(() => mockPrisma)
}));

vi.mock('../config/prisma', () => ({
  prisma: mockPrisma
}));

vi.mock('jsonwebtoken', () => {
  const verify = vi.fn();
  const sign = vi.fn();
  return {
    default: { verify, sign },
    verify,
    sign,
  };
});

describe('OS Controller', () => {
  const mockToken = 'mock-token';
  const mockUser = { id: 'user-1', role: 'ADMIN', active: true, companyId: 'comp-1', branchId: '33333333-3333-4333-a333-333333333333' };

  beforeEach(() => {
    vi.clearAllMocks();
    (jwt.verify as jest.Mock).mockReturnValue({ sub: 'user-1', companyId: 'comp-1', role: 'ADMIN' });
    (prismaClient.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prismaClient.client.findFirst as jest.Mock).mockResolvedValue({ id: '11111111-1111-4111-a111-111111111111', companyId: 'comp-1' });
    (prismaClient.vehicle.findFirst as jest.Mock).mockResolvedValue({ id: '22222222-2222-4222-a222-222222222222', companyId: 'comp-1', clientId: '11111111-1111-4111-a111-111111111111' });
    (prismaClient.branch.findFirst as jest.Mock).mockResolvedValue({ id: '33333333-3333-4333-a333-333333333333', companyId: 'comp-1' });
  });

  describe('GET /api/os', () => {
    it('should return a list of service orders', async () => {
      (prismaClient.serviceOrder.findMany as jest.Mock).mockResolvedValue([{ id: 'os-1', number: 101 }]);

      const response = await request(app)
        .get('/api/os')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });
  });

  describe('POST /api/os', () => {
    it('should create a new service order', async () => {
      const osData = {
        clientId: '11111111-1111-4111-a111-111111111111',
        vehicleId: '22222222-2222-4222-a222-222222222222',
        branchId: '33333333-3333-4333-a333-333333333333',
        notes: 'Revisão'
      };

      (prismaClient.serviceOrder.create as jest.Mock).mockResolvedValue({ id: 'os-1', ...osData, number: 102 });

      const response = await request(app)
        .post('/api/os')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(osData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Ordem de Serviço aberta com sucesso.');
    });
  });

  describe('PATCH /api/os/:id/complete', () => {
    it('should update OS status to FINISHED', async () => {
      (prismaClient.serviceOrder.findFirst as jest.Mock).mockResolvedValue({ 
        id: 'os-1', 
        status: 'IN_PROGRESS',
        parts: [],
        services: [],
        branchId: '33333333-3333-4333-a333-333333333333',
        number: 101,
        finalValue: 100,
        notes: '[DIAGNÓSTICO TÉCNICO]\nO motor apresenta barulho incomum.'
      });
      (prismaClient.serviceOrderApproval.findFirst as jest.Mock).mockResolvedValue({
        id: 'app-1',
        status: 'APPROVED',
        version: 1,
        snapshot: {
          parts: [],
          services: []
        }
      });
      (prismaClient.inventoryMovement.findMany as jest.Mock).mockResolvedValue([]);
      (prismaClient.serviceOrder.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prismaClient.serviceOrder.update as jest.Mock).mockResolvedValue({ id: 'os-1', status: 'FINISHED' });
      (prismaClient.financialRecord.create as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .patch('/api/os/os-1/complete')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ completionNotes: 'Serviço concluído com sucesso e testado.' });

      console.log('PATCH RESPONSE:', response.status, response.body);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/os/:id/pdf', () => {
    it('should return a PDF document', async () => {
      (prismaClient.serviceOrder.findUnique as jest.Mock).mockResolvedValue({
        id: 'os-1',
        number: 101,
        createdAt: new Date(),
        status: 'OPEN',
        branch: { name: 'Matriz', cnpj: '000', address: 'Rua 1', phone: '123' },
        client: { name: 'João', document: '111', phone: '222' },
        vehicle: { brand: 'VW', model: 'Gol', plate: 'AAA', year: 2020, mileage: 1000 },
        services: [],
        parts: []
      });

      const response = await request(app)
        .get('/api/os/os-1/pdf')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.header['content-type']).toBe('application/pdf');
    });
  });

  describe('PATCH /api/os/:id/status', () => {
    it('should allow valid status transitions', async () => {
      (prismaClient.serviceOrder.findFirst as jest.Mock).mockResolvedValue({
        id: 'os-1',
        status: 'OPEN',
        companyId: 'comp-1'
      });
      (prismaClient.serviceOrder.update as jest.Mock).mockResolvedValue({
        id: 'os-1',
        status: 'IN_PROGRESS'
      });

      const response = await request(app)
        .patch('/api/os/os-1/status')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ status: 'IN_PROGRESS' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('IN_PROGRESS');
    });

    it('should block direct transition to FINISHED', async () => {
      (prismaClient.serviceOrder.findFirst as jest.Mock).mockResolvedValue({
        id: 'os-1',
        status: 'OPEN',
        companyId: 'comp-1'
      });

      const response = await request(app)
        .patch('/api/os/os-1/status')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ status: 'FINISHED' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('utilize a seção de Encerramento');
    });

    it('should return 422 for invalid transition matrix path', async () => {
      (prismaClient.serviceOrder.findFirst as jest.Mock).mockResolvedValue({
        id: 'os-1',
        status: 'OPEN',
        companyId: 'comp-1'
      });

      const response = await request(app)
        .patch('/api/os/os-1/status')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ status: 'AWAITING_PARTS' }); // OPEN cannot go to AWAITING_PARTS? Let's check ALLOWED_TRANSITIONS. Wait, OPEN can go to AWAITING_PARTS. Let's send an invalid target like finished or wait, OPEN cannot go to finished. But finished has a custom 400 check. What status is not allowed? OPEN to IN_PROGRESS is allowed. What about OPEN to FINISHED? Yes, that returns 400. What about OPEN to some other status?
        // Wait, ALLOWED_TRANSITIONS: OPEN: ['IN_PROGRESS', 'AWAITING_PARTS', 'CANCELLED']
        // So OPEN cannot go to OPEN? Or wait, if currentStatus === dbStatus it returns os.
        // What about AWAITING_PARTS to OPEN? AWAITING_PARTS: ['IN_PROGRESS', 'CANCELLED']. So AWAITING_PARTS cannot go to OPEN!
        // Yes! Let's mock currentStatus as AWAITING_PARTS and transition to OPEN!
      (prismaClient.serviceOrder.findFirst as jest.Mock).mockResolvedValue({
        id: 'os-1',
        status: 'AWAITING_PARTS',
        companyId: 'comp-1'
      });

      const res = await request(app)
        .patch('/api/os/os-1/status')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ status: 'OPEN' });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
    });
  });
});
