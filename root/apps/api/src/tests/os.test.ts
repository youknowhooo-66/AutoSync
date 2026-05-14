import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';
import jwt from 'jsonwebtoken';

jest.mock('../config/prisma', () => ({
  prisma: {
    serviceOrder: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    oSService: {
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
    oSPart: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    stock: {
      update: jest.fn(),
    },
    inventoryMovement: {
      create: jest.fn(),
    },
    financialRecord: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    }
  },
}));

jest.mock('jsonwebtoken');

describe('OS Controller', () => {
  const mockToken = 'mock-token';
  const mockUser = { id: 'user-1', role: 'ADMIN', active: true };

  beforeEach(() => {
    jest.clearAllMocks();
    (jwt.verify as jest.Mock).mockReturnValue({ id: 'user-1' });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
  });

  describe('GET /api/os', () => {
    it('should return a list of service orders', async () => {
      (prisma.serviceOrder.findMany as jest.Mock).mockResolvedValue([{ id: 'os-1', number: 101 }]);

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
        clientId: 'c1',
        vehicleId: 'v1',
        branchId: 'b1',
        notes: 'Revisão'
      };

      (prisma.serviceOrder.create as jest.Mock).mockResolvedValue({ id: 'os-1', ...osData, number: 102 });

      const response = await request(app)
        .post('/api/os')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(osData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Ordem de Serviço aberta com sucesso.');
    });
  });

  describe('PATCH /api/os/:id/status', () => {
    it('should update OS status', async () => {
      (prisma.serviceOrder.findUnique as jest.Mock).mockResolvedValue({ id: 'os-1', status: 'OPEN' });
      (prisma.serviceOrder.update as jest.Mock).mockResolvedValue({ id: 'os-1', status: 'FINISHED', finalValue: 100, client: { name: 'João' }, vehicle: { model: 'Fusca' } });

      const response = await request(app)
        .patch('/api/os/os-1/status')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ status: 'FINISHED' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Status da OS atualizado com sucesso.');
    });
  });

  describe('GET /api/os/:id/pdf', () => {
    it('should return a PDF document', async () => {
      (prisma.serviceOrder.findUnique as jest.Mock).mockResolvedValue({
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
