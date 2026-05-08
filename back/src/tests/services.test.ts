import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';
import jwt from 'jsonwebtoken';

jest.mock('../config/prisma', () => ({
  prisma: {
    branch: { findMany: jest.fn(), create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    financialRecord: { findMany: jest.fn(), create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    user: { findMany: jest.fn(), create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    supplier: { findMany: jest.fn(), create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    vehicle: { findMany: jest.fn(), create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    auditLog: { findMany: jest.fn(), create: jest.fn() },
  },
}));

jest.mock('jsonwebtoken');

describe('Other Services Integration', () => {
  const mockToken = 'mock-token';
  const mockUser = { id: 'admin-id', role: 'ADMIN', active: true };

  beforeEach(() => {
    jest.clearAllMocks();
    (jwt.verify as jest.Mock).mockReturnValue({ id: 'admin-id' });
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
