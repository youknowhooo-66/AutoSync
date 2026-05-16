import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';
import jwt from 'jsonwebtoken';

jest.mock('../config/prisma', () => ({
  prisma: {
    part: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    stock: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    branch: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    inventoryMovement: {
      create: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    oSPart: {
      findFirst: jest.fn(),
    }
  },
}));

jest.mock('jsonwebtoken');

describe('Inventory Controller', () => {
  const mockToken = 'mock-token';
  const mockUser = { id: 'user-1', role: 'ADMIN', active: true };

  beforeEach(() => {
    jest.clearAllMocks();
    (jwt.verify as jest.Mock).mockReturnValue({ id: 'user-1' });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
  });

  describe('GET /api/inventory/parts', () => {
    it('should return a list of parts', async () => {
      const mockParts = [{ id: '1', name: 'Bateria' }];
      (prisma.part.findMany as jest.Mock).mockResolvedValue(mockParts);

      const response = await request(app)
        .get('/api/inventory/parts')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockParts);
    });
  });

  describe('POST /api/inventory/parts', () => {
    it('should create a new part', async () => {
      const newPartData = {
        name: 'Pastilha de Freio',
        internalCode: 'PF-001',
        initialStock: 10,
        branchId: 'branch-1'
      };

      const mockCreatedPart = { id: 'part-1', ...newPartData };
      (prisma.part.create as jest.Mock).mockResolvedValue(mockCreatedPart);
      (prisma.branch.findUnique as jest.Mock).mockResolvedValue({ id: 'branch-1' });
      (prisma.stock.create as jest.Mock).mockResolvedValue({ id: 'stock-1' });

      // Mock transaction
      (prisma as any).$transaction = jest.fn().mockImplementation(async (cb) => cb(prisma));

      const response = await request(app)
        .post('/api/inventory/parts')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(newPartData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Peça cadastrada com sucesso.');
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/inventory/parts')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ name: '' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/inventory/transfer', () => {
    it('should transfer stock between branches', async () => {
      const transferData = {
        partId: 'part-1',
        fromBranchId: 'branch-1',
        toBranchId: 'branch-2',
        quantity: 5
      };

      (prisma.branch.findMany as jest.Mock).mockResolvedValue([{ id: 'branch-1' }, { id: 'branch-2' }]);
      (prisma.stock.findUnique as jest.Mock).mockResolvedValue({ id: 'stock-1', quantity: 10 });
      (prisma as any).$transaction = jest.fn().mockImplementation(async (cb) => cb(prisma));

      const response = await request(app)
        .post('/api/inventory/transfer')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(transferData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Transferência realizada com sucesso.');
    });

    it('should return 400 for invalid quantity', async () => {
      const response = await request(app)
        .post('/api/inventory/transfer')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ partId: '1', fromBranchId: 'a', toBranchId: 'b', quantity: -1 });

      expect(response.status).toBe(400);
    });
  });
});
