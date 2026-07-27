import request from 'supertest';
import app from '../app';
import { prismaClient } from '../shared/database/prismaClient';
import jwt from 'jsonwebtoken';

const mockPrisma = vi.hoisted(() => {
  const m = {
    part: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    stock: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    branch: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    inventoryMovement: {
      create: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    oSPart: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn().mockImplementation(async (cb) => cb(m)),
    $queryRaw: vi.fn(),
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

describe('Inventory Controller', () => {
  const mockToken = 'mock-token';
  const mockUser = { id: 'user-1', role: 'ADMIN', active: true, companyId: 'comp-1' };

  beforeEach(() => {
    vi.clearAllMocks();
    (jwt.verify as jest.Mock).mockReturnValue({ sub: 'user-1', companyId: 'comp-1', role: 'ADMIN' });
    (prismaClient.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
  });

  describe('GET /api/inventory/parts', () => {
    it('should return paginated parts with the new search contract', async () => {
      // SearchPartsService uses $queryRaw for count and data queries
      // First call: pg_trgm extension check, Second call: COUNT, Third call: data rows
      (prismaClient.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([{ count: 0n }])    // pg_trgm check (not installed -> PREFIX mode)
        .mockResolvedValueOnce([{ count: 1n }])    // COUNT query
        .mockResolvedValueOnce([{                  // data rows
          id: 'part-1',
          name: 'Bateria',
          sku: 'BAT-001',
          manufacturer_code: null,
          barcode: null,
          brand: 'Bosch',
          description: null,
          category: null,
          active: true,
          on_hand_quantity: '5.000',
          reserved_quantity: '0.000',
          available_quantity: '5.000',
          location: null,
          average_cost: null,
          relevance: '0',
        }]);

      const response = await request(app)
        .get('/api/inventory/parts')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('totalPages');
      expect(Array.isArray(response.body.data.items)).toBe(true);
      expect(response.body.data.items[0]).toMatchObject({
        id: 'part-1',
        name: 'Bateria',
        sku: 'BAT-001',
        canSelectFromStock: true,
      });
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
      (prismaClient.part.create as jest.Mock).mockResolvedValue(mockCreatedPart);
      (prismaClient.branch.findUnique as jest.Mock).mockResolvedValue({ id: 'branch-1' });
      (prismaClient.stock.create as jest.Mock).mockResolvedValue({ id: 'stock-1' });

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
        sourceBranchId: 'branch-1',
        targetBranchId: 'branch-2',
        quantity: 5
      };

      (prismaClient.branch.findMany as jest.Mock).mockResolvedValue([{ id: 'branch-1' }, { id: 'branch-2' }]);
      (prismaClient.stock.findUnique as jest.Mock).mockResolvedValue({ id: 'stock-1', quantity: 10 });

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
        .send({ partId: '1', sourceBranchId: 'a', targetBranchId: 'b', quantity: -1 });

      expect(response.status).toBe(400);
    });
  });
});
