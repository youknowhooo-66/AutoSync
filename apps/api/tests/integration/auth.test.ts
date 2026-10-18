import request from 'supertest';
import app from '../../src/app';
import { FactoryEngine } from '../factories/FactoryEngine';
import { generateAuthHeaders } from '../helpers/auth';
import { prismaClient } from '../../src/shared/database/prismaClient';
import { PASSWORD_COST } from '../../src/shared/security/password';

function sessionCookieFrom(response: request.Response): string {
  const cookies = ([] as string[]).concat(response.headers['set-cookie'] ?? []);
  const session = cookies.find((c) => c.startsWith('autosync_session='));
  if (!session) throw new Error('session cookie not set');
  return session;
}

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

  it('sets an httpOnly session cookie that authenticates requests, and logout clears it', async () => {
    const company = await FactoryEngine.createCompany();
    await FactoryEngine.createUser(company.id, { email: 'cookie@autosync.com.br', password: 'mypassword123', role: 'ADMIN' });

    const login = await request(app).post('/api/auth/login').send({ email: 'cookie@autosync.com.br', password: 'mypassword123' });
    expect(login.status).toBe(200);
    const cookie = sessionCookieFrom(login);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);

    const pair = cookie.split(';')[0];
    const withCookie = await request(app).get('/api/clients').set('Cookie', pair);
    expect(withCookie.status).toBe(200);

    const logout = await request(app).post('/api/auth/logout').set('Cookie', pair);
    expect(logout.status).toBe(204);
    expect(sessionCookieFrom(logout)).toMatch(/Expires=Thu, 01 Jan 1970/);
  });

  it('answers an inactive user and an unknown email exactly like a wrong password', async () => {
    const company = await FactoryEngine.createCompany();
    await FactoryEngine.createUser(company.id, { email: 'inactive@autosync.com.br', password: 'mypassword123', active: false });

    const inactive = await request(app).post('/api/auth/login').send({ email: 'inactive@autosync.com.br', password: 'mypassword123' });
    const unknown = await request(app).post('/api/auth/login').send({ email: 'nobody@autosync.com.br', password: 'mypassword123' });

    for (const response of [inactive, unknown]) {
      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Incorrect email\/password/);
      expect(response.headers['set-cookie']).toBeUndefined();
    }
  });

  it('upgrades a weaker password hash on successful login', async () => {
    const company = await FactoryEngine.createCompany();
    const user = await FactoryEngine.createUser(company.id, { email: 'rehash@autosync.com.br', password: 'mypassword123' });

    const login = await request(app).post('/api/auth/login').send({ email: 'rehash@autosync.com.br', password: 'mypassword123' });
    expect(login.status).toBe(200);

    const stored = await prismaClient.user.findUniqueOrThrow({ where: { id: user.id }, select: { password: true } });
    expect(stored.password).toMatch(new RegExp(`^\\$2[aby]\\$${PASSWORD_COST}\\$`));
  });
});
