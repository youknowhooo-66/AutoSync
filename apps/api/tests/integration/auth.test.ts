import request from 'supertest';
import app from '../../src/app';
import { FactoryEngine } from '../factories/FactoryEngine';
import { generateAuthHeaders } from '../helpers/auth';

describe('Auth & Multi-Tenant Integration Tests', () => {
  it('should authenticate user with valid credentials', async () => {
    // 1. Arrange - create company and user
    const company = await FactoryEngine.createCompany();
    const user = await FactoryEngine.createUser(company.id, {
      email: 'tenant-a@autosync.com.br',
      password: 'mypassword123',
    });

    // 2. Act - attempt login
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'tenant-a@autosync.com.br',
        password: 'mypassword123',
      });

    // 3. Assert
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user).toHaveProperty('id', user.id);
    expect(response.body.user).toHaveProperty('companyId', company.id);
  });

  it('should return 401 when logging in with incorrect password', async () => {
    const company = await FactoryEngine.createCompany();
    await FactoryEngine.createUser(company.id, {
      email: 'tenant-b@autosync.com.br',
      password: 'mypassword123',
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'tenant-b@autosync.com.br',
        password: 'wrongpassword',
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Incorrect email\/password/);
  });

  it('should deny access to protected routes without a token', async () => {
    const response = await request(app).get('/api/clients');

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/JWT token is missing/);
  });

  it('should deny access to protected routes with an invalid token', async () => {
    const response = await request(app)
      .get('/api/clients')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Invalid JWT token/);
  });

  it('should strictly segregate data and prevent cross-tenant access', async () => {
    // Arrange: Create Company A, User A, and Client A
    const companyA = await FactoryEngine.createCompany();
    const userA = await FactoryEngine.createUser(companyA.id, { role: 'ADMIN' });
    const clientA = await FactoryEngine.createClient(companyA.id, { name: 'Client Company A' });

    // Arrange: Create Company B, User B
    const companyB = await FactoryEngine.createCompany();
    const userB = await FactoryEngine.createUser(companyB.id, { role: 'ADMIN' });
    const clientB = await FactoryEngine.createClient(companyB.id, { name: 'Client Company B' });

    // Act & Assert: List clients as User A
    const headersA = generateAuthHeaders(userA);
    const responseA = await request(app)
      .get('/api/clients')
      .set(headersA);

    expect(responseA.status).toBe(200);
    expect(responseA.body).toHaveLength(1);
    expect(responseA.body[0].id).toBe(clientA.id);
    expect(responseA.body[0].name).toBe('Client Company A');

    // Act & Assert: List clients as User B
    const headersB = generateAuthHeaders(userB);
    const responseB = await request(app)
      .get('/api/clients')
      .set(headersB);

    expect(responseB.status).toBe(200);
    expect(responseB.body).toHaveLength(1);
    expect(responseB.body[0].id).toBe(clientB.id);
    expect(responseB.body[0].name).toBe('Client Company B');
    
    // Explicitly assert that client A is not leaked to User B
    const leaked = responseB.body.some((c: any) => c.id === clientA.id);
    expect(leaked).toBe(false);
  });
});
