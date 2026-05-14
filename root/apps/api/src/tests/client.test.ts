import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';
import jwt from 'jsonwebtoken';

jest.mock('../config/prisma', () => ({
  prisma: {
    client: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
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

describe('Client Controller', () => {
  const mockToken = 'mock-token';
  const mockUser = { id: 'user-1', role: 'ADMIN', active: true };

  beforeEach(() => {
    jest.clearAllMocks();
    (jwt.verify as jest.Mock).mockReturnValue({ id: 'user-1' });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
  });

  describe('GET /api/clients', () => {
    it('should return a list of clients', async () => {
      (prisma.client.findMany as jest.Mock).mockResolvedValue([{ id: 'c1', name: 'Cliente A' }]);

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

      (prisma.client.create as jest.Mock).mockResolvedValue({ id: 'c1', ...clientData });

      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(clientData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Cliente cadastrado com sucesso.');
    });
  });
});
