import request from 'supertest';
import app from '../app';
import jwt from 'jsonwebtoken';
import { prismaClient } from '../shared/database/prismaClient';

vi.mock('jsonwebtoken', () => {
  const verify = vi.fn();
  const sign = vi.fn();
  return {
    default: { verify, sign },
    verify,
    sign,
  };
});
vi.mock('../shared/database/prismaClient', () => {
  const m = {
    user: {
      findUnique: vi.fn(),
    }
  };
  return {
    prismaClient: m,
    PrismaClient: vi.fn().mockImplementation(() => m)
  };
});

describe('App endpoints', () => {
  it('should return 200 OK from /health', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
  });

  it('should return 404 for unknown routes when authenticated', async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ sub: 'user-1', companyId: 'comp-1', role: 'ADMIN' });
    (prismaClient.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1', active: true });

    const response = await request(app)
      .get('/api/unknown-route')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(404);
  });
});
