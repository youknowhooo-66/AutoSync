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
  const mockUser = { id: 'user-1', role: 'ADMIN', active: true };

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
        status: 'OPEN',
        parts: [],
        services: [],
        branchId: 'b1',
        number: 101,
        finalValue: 100
      });
      (prismaClient.serviceOrder.update as jest.Mock).mockResolvedValue({ id: 'os-1', status: 'FINISHED' });
      (prismaClient.financialRecord.create as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .patch('/api/os/os-1/complete')
        .set('Authorization', `Bearer ${mockToken}`);

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
});
