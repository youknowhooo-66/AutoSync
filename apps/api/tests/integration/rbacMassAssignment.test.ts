import request from 'supertest';
import app from '../../src/app';
import { prismaClient } from '../../src/shared/database/prismaClient';
import { FactoryEngine } from '../factories/FactoryEngine';
import { generateAuthHeaders } from '../helpers/auth';

/** RBAC and mass-assignment regressions (DELIVERY_PLAN step 3: 0.2, 0.3, 0.6). */
describe('RBAC and mass-assignment regressions', () => {
  let companyId: string;
  let otherCompanyId: string;
  let otherBranchId: string;
  let admin: Awaited<ReturnType<typeof FactoryEngine.createUser>>;
  let mechanic: Awaited<ReturnType<typeof FactoryEngine.createUser>>;
  let clientId: string;

  beforeEach(async () => {
    const company = await FactoryEngine.createCompany();
    const branch = await FactoryEngine.createBranch(company.id);
    const other = await FactoryEngine.createCompany();
    const otherBranch = await FactoryEngine.createBranch(other.id);
    companyId = company.id;
    otherCompanyId = other.id;
    otherBranchId = otherBranch.id;
    admin = await FactoryEngine.createUser(company.id, { role: 'ADMIN', branchId: branch.id });
    mechanic = await FactoryEngine.createUser(company.id, { role: 'MECHANIC', branchId: branch.id });
    clientId = (await FactoryEngine.createClient(company.id)).id;
  });

  const userRow = (id: string) =>
    prismaClient.user.findUniqueOrThrow({ where: { id }, select: { role: true, active: true, companyId: true, branchId: true } });

  describe('RBAC', () => {
    it('MECHANIC cannot promote itself to ADMIN', async () => {
      const res = await request(app).put(`/api/users/${mechanic.id}`).set(generateAuthHeaders(mechanic)).send({ role: 'ADMIN' });
      expect(res.status).toBe(403);
      expect((await userRow(mechanic.id)).role).toBe('MECHANIC');
    });

    it('MECHANIC cannot change the role of another user', async () => {
      const res = await request(app).put(`/api/users/${admin.id}`).set(generateAuthHeaders(mechanic)).send({ role: 'MECHANIC' });
      expect(res.status).toBe(403);
      expect((await userRow(admin.id)).role).toBe('ADMIN');
    });

    it('MECHANIC cannot deactivate another user', async () => {
      const res = await request(app).put(`/api/users/${admin.id}`).set(generateAuthHeaders(mechanic)).send({ active: false });
      expect(res.status).toBe(403);
      expect((await userRow(admin.id)).active).toBe(true);
    });

    it('MECHANIC cannot list companies', async () => {
      const res = await request(app).get('/api/companies').set(generateAuthHeaders(mechanic));
      expect(res.status).toBe(403);
    });

    it('MECHANIC cannot read the audit log', async () => {
      const res = await request(app).get('/api/audit').set(generateAuthHeaders(mechanic));
      expect(res.status).toBe(403);
    });

    it('ADMIN cannot change its own role', async () => {
      const res = await request(app).put(`/api/users/${admin.id}`).set(generateAuthHeaders(admin)).send({ role: 'MECHANIC' });
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect((await userRow(admin.id)).role).toBe('ADMIN');
    });
  });

  describe('user management rules', () => {
    it('ADMIN can change the role and status of another user', async () => {
      const res = await request(app).put(`/api/users/${mechanic.id}`).set(generateAuthHeaders(admin)).send({ role: 'STOCKIST', active: false });
      expect(res.status).toBe(200);
      expect(await userRow(mechanic.id)).toMatchObject({ role: 'STOCKIST', active: false });
    });

    it('MANAGER cannot edit an ADMIN (e.g. reset its password)', async () => {
      const manager = await FactoryEngine.createUser(companyId, { role: 'MANAGER' });
      const res = await request(app).put(`/api/users/${admin.id}`).set(generateAuthHeaders(manager)).send({ password: 'Takeover123!' });
      expect(res.status).toBe(403);
    });

    it('a partial update keeps the fields it does not mention', async () => {
      const before = await prismaClient.user.findUniqueOrThrow({ where: { id: mechanic.id } });
      const res = await request(app).put(`/api/users/${mechanic.id}`).set(generateAuthHeaders(admin)).send({ active: false });
      expect(res.status).toBe(200);
      const after = await prismaClient.user.findUniqueOrThrow({ where: { id: mechanic.id } });
      expect(after).toMatchObject({ name: before.name, email: before.email, branchId: before.branchId, role: before.role, active: false });
    });

    it('the user list never exposes password hashes', async () => {
      const res = await request(app).get('/api/users').set(generateAuthHeaders(admin));
      expect(res.status).toBe(200);
      expect(JSON.stringify(res.body)).not.toContain('password');
    });
  });

  describe('mass assignment', () => {
    it('user update rejects companyId in the body', async () => {
      const res = await request(app).put(`/api/users/${mechanic.id}`).set(generateAuthHeaders(admin)).send({ companyId: otherCompanyId });
      expect(res.status).toBe(400);
      expect((await userRow(mechanic.id)).companyId).toBe(companyId);
    });

    it('user update rejects a branchId from another company', async () => {
      const res = await request(app).put(`/api/users/${mechanic.id}`).set(generateAuthHeaders(admin)).send({ branchId: otherBranchId });
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect((await userRow(mechanic.id)).branchId).not.toBe(otherBranchId);
    });

    it('client update rejects companyId in the body', async () => {
      const res = await request(app).put(`/api/clients/${clientId}`).set(generateAuthHeaders(admin)).send({ name: 'Renamed', companyId: otherCompanyId });
      expect(res.status).toBe(400);
      const row = await prismaClient.client.findUniqueOrThrow({ where: { id: clientId } });
      expect(row.companyId).toBe(companyId);
    });

    it('client create rejects companyId in the body', async () => {
      const res = await request(app)
        .post('/api/clients')
        .set(generateAuthHeaders(admin))
        .send({ name: 'Strict client', document: '12312312399', companyId: otherCompanyId });
      expect(res.status).toBe(400);
    });

    // The valid request must succeed first, otherwise a 400 proves nothing.
    it('user create rejects companyId in the body', async () => {
      const body = { name: 'Strict user', password: 'Password123!', role: 'MECHANIC' };
      const ok = await request(app).post('/api/users').set(generateAuthHeaders(admin)).send({ ...body, email: 'valid-user@example.com' });
      expect(ok.status).toBe(201);

      const res = await request(app)
        .post('/api/users')
        .set(generateAuthHeaders(admin))
        .send({ ...body, email: 'strict-user@example.com', companyId: otherCompanyId });
      expect(res.status).toBe(400);
    });
  });
});
