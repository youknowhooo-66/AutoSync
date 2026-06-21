import request from 'supertest';
import app from '../app';
import { prismaClient } from '../shared/database/prismaClient';
import jwt from 'jsonwebtoken';

const mockPrisma = vi.hoisted(() => ({
  client: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  }
}));

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

describe('Client Controller', () => {
  const mockToken = 'mock-token';
  const mockUser = { id: 'user-1', role: 'ADMIN', active: true, companyId: 'comp-1' };

  beforeEach(() => {
    vi.clearAllMocks();
    (jwt.verify as jest.Mock).mockReturnValue({ sub: 'user-1', companyId: 'comp-1', role: 'ADMIN' });
    (prismaClient.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
  });

  describe('GET /api/clients', () => {
    it('should return a list of clients', async () => {
      (prismaClient.client.findMany as jest.Mock).mockResolvedValue([{ id: 'c1', name: 'Cliente A' }]);

      const response = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });
  });

  describe('POST /api/clients', () => {
    it('should create a new client', async () => {
      const clientData = {
        name: 'Carlos',
        document: '12345678901',
        email: 'carlos@test.com'
      };

      (prismaClient.client.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaClient.client.create as jest.Mock).mockResolvedValue({ id: 'c1', ...clientData });

      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(clientData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Cliente cadastrado com sucesso.');
    });
  });
});
