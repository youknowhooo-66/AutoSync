import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';
import jwt from 'jsonwebtoken';

const mockPrisma = vi.hoisted(() => ({
  branch: { findMany: vi.fn(), create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  financialRecord: { findMany: vi.fn(), create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  user: { findMany: vi.fn(), create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  supplier: { findMany: vi.fn(), create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  vehicle: { findMany: vi.fn(), create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  auditLog: { findMany: vi.fn(), create: vi.fn() },
}));

vi.mock('../config/prisma', () => ({
  prisma: mockPrisma,
}));

vi.mock('../shared/database/prismaClient', () => ({
  prismaClient: mockPrisma,
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

describe('Other Services Integration', () => {
  const mockToken = 'mock-token';
  const mockUser = { id: 'admin-id', role: 'ADMIN', active: true, companyId: 'comp-1' };

  beforeEach(() => {
    vi.clearAllMocks();
    (jwt.verify as jest.Mock).mockReturnValue({ sub: 'admin-id', companyId: 'comp-1', role: 'ADMIN' });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
  });

  describe('Branches', () => {
    it('should list branches', async () => {
      (prisma.branch.findMany as jest.Mock).mockResolvedValue([{ id: 'b1', name: 'Matriz' }]);
      const response = await request(app).get('/api/branches').set('Authorization', `Bearer ${mockToken}`);
      expect(response.status).toBe(200);
    });
  });

  describe('Financial', () => {
    it('should list financial records', async () => {
      (prisma.financialRecord.findMany as jest.Mock).mockResolvedValue([]);
      const response = await request(app).get('/api/financial').set('Authorization', `Bearer ${mockToken}`);
      expect(response.status).toBe(200);
    });
  });

  describe('Users', () => {
    it('should list users', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([mockUser]);
      const response = await request(app).get('/api/users').set('Authorization', `Bearer ${mockToken}`);
      expect(response.status).toBe(200);
    });
  });

  describe('Suppliers', () => {
    it('should list suppliers', async () => {
      (prisma.supplier.findMany as jest.Mock).mockResolvedValue([]);
      const response = await request(app).get('/api/suppliers').set('Authorization', `Bearer ${mockToken}`);
      expect(response.status).toBe(200);
    });
  });

  describe('Vehicles', () => {
    it('should list vehicles', async () => {
      (prisma.vehicle.findMany as jest.Mock).mockResolvedValue([]);
      const response = await request(app).get('/api/vehicles').set('Authorization', `Bearer ${mockToken}`);
      expect(response.status).toBe(200);
    });
  });
});
