import request from 'supertest';
import app from '../app';

describe('Authentication Integration Tests', () => {
  it('should not be able to login with invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/sessions')
      .send({
        email: 'invalid@example.com',
        password: 'wrong-password',
        companyId: '00000000-0000-0000-0000-000000000000'
      });

    expect(response.status).toBe(400); // Because Zod or AppError will catch it
    expect(response.body.success).toBe(false);
  });
});
