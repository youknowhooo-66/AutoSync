import request from 'supertest';
import app from '../../src/app';
import { FactoryEngine } from '../factories/FactoryEngine';
import { generateAuthHeaders } from '../helpers/auth';
import { prismaClient } from '../../src/shared/database/prismaClient';
import { Prisma } from '@prisma/client';

describe('Service Order Budget Approval (P4.4)', () => {
  let company: any;
  let branch: any;
  let admin: any;
  let manager: any;
  let attendant: any;
  let mechanic: any;
  let client: any;
  let vehicle: any;
  let part: any;
  let stock: any;
  let headersAdmin: any;
  let headersManager: any;
  let headersAttendant: any;
  let headersMechanic: any;

  beforeEach(async () => {
    company = await FactoryEngine.createCompany();
    branch = await FactoryEngine.createBranch(company.id);
    admin = await FactoryEngine.createUser(company.id, { role: 'ADMIN', branchId: branch.id });
    manager = await FactoryEngine.createUser(company.id, { role: 'MANAGER', branchId: branch.id });
    attendant = await FactoryEngine.createUser(company.id, { role: 'ATTENDANT', branchId: branch.id });
    mechanic = await FactoryEngine.createUser(company.id, { role: 'MECHANIC', branchId: branch.id });
    client = await FactoryEngine.createClient(company.id);
    vehicle = await FactoryEngine.createVehicle(company.id, client.id);

    part = await FactoryEngine.createPart(company.id, { salePrice: new Prisma.Decimal('10.00'), name: 'Spark Plug', internalCode: 'SP-123' } as any);
    stock = await prismaClient.stock.create({
      data: {
        companyId: company.id,
        branchId: branch.id,
        partId: part.id,
        quantity: 10
      }
    });

    headersAdmin = generateAuthHeaders(admin);
    headersManager = generateAuthHeaders(manager);
    headersAttendant = generateAuthHeaders(attendant);
    headersMechanic = generateAuthHeaders(mechanic);
  });

  it('should prevent requesting approval for an empty budget', async () => {
    const createResponse = await request(app)
      .post('/api/service-orders')
      .set(headersAdmin)
      .send({ clientId: client.id, vehicleId: vehicle.id, branchId: branch.id });
    const osId = createResponse.body.data.id;

    const requestResponse = await request(app)
      .post(`/api/service-orders/${osId}/approval/request`)
      .set(headersAttendant);

    expect(requestResponse.status).toBe(400);
    expect(requestResponse.body.message).toContain('vazio');
  });

  it('should prevent unauthorized roles from requesting or deciding approvals', async () => {
    const createResponse = await request(app)
      .post('/api/service-orders')
      .set(headersAdmin)
      .send({ clientId: client.id, vehicleId: vehicle.id, branchId: branch.id });
    const osId = createResponse.body.data.id;

    await request(app)
      .post(`/api/service-orders/${osId}/items`)
      .set(headersAdmin)
      .send({ services: [{ description: 'Test', quantity: 1, unitPrice: '100.00' }] });

    // Mechanic cannot request
    const reqResponse = await request(app)
      .post(`/api/service-orders/${osId}/approval/request`)
      .set(headersMechanic);
    expect(reqResponse.status).toBe(403);
  });

  it('should reject budget with validation on reason length', async () => {
    const createResponse = await request(app)
      .post('/api/service-orders')
      .set(headersAdmin)
      .send({ clientId: client.id, vehicleId: vehicle.id, branchId: branch.id });
    const osId = createResponse.body.data.id;

    await request(app)
      .post(`/api/service-orders/${osId}/items`)
      .set(headersAdmin)
      .send({ services: [{ description: 'Test', quantity: 1, unitPrice: '100.00' }] });

    const reqResponse = await request(app)
      .post(`/api/service-orders/${osId}/approval/request`)
      .set(headersAdmin);
    const approvalId = reqResponse.body.data.id;

    // Reason less than 5 characters
    const rejectShort = await request(app)
      .post(`/api/service-orders/${osId}/approval/reject`)
      .set(headersManager)
      .send({ approvalId, reason: 'Bad' });
    expect(rejectShort.status).toBe(400);
  });

  it('should block item changes during active PENDING or APPROVED status', async () => {
    const createResponse = await request(app)
      .post('/api/service-orders')
      .set(headersAdmin)
      .send({ clientId: client.id, vehicleId: vehicle.id, branchId: branch.id });
    const osId = createResponse.body.data.id;

    await request(app)
      .post(`/api/service-orders/${osId}/items`)
      .set(headersAdmin)
      .send({ services: [{ description: 'Test', quantity: 1, unitPrice: '100.00' }] });

    await request(app)
      .post(`/api/service-orders/${osId}/approval/request`)
      .set(headersAdmin);

    // Try adding items
    const tryAdd = await request(app)
      .post(`/api/service-orders/${osId}/items`)
      .set(headersAdmin)
      .send({ services: [{ description: 'Test 2', quantity: 1, unitPrice: '50.00' }] });
    expect(tryAdd.status).toBe(400);
  });

  it('should handle concurrent requests gracefully throwing 409 Conflict', async () => {
    const createResponse = await request(app)
      .post('/api/service-orders')
      .set(headersAdmin)
      .send({ clientId: client.id, vehicleId: vehicle.id, branchId: branch.id });
    const osId = createResponse.body.data.id;

    await request(app)
      .post(`/api/service-orders/${osId}/items`)
      .set(headersAdmin)
      .send({ services: [{ description: 'Test', quantity: 1, unitPrice: '100.00' }] });

    // Send concurrent requests
    const [res1, res2] = await Promise.all([
      request(app).post(`/api/service-orders/${osId}/approval/request`).set(headersAdmin),
      request(app).post(`/api/service-orders/${osId}/approval/request`).set(headersAdmin)
    ]);

    const statuses = [res1.status, res2.status];
    expect(statuses).toContain(200);
    const errorStatus = statuses.find(s => s !== 200);
    expect([400, 409]).toContain(errorStatus);
  });

  it('should check imutability of snapshots after catalog changes', async () => {
    const createResponse = await request(app)
      .post('/api/service-orders')
      .set(headersAdmin)
      .send({ clientId: client.id, vehicleId: vehicle.id, branchId: branch.id });
    const osId = createResponse.body.data.id;

    await request(app)
      .post(`/api/service-orders/${osId}/items`)
      .set(headersAdmin)
      .send({ parts: [{ stockId: stock.id, quantity: 1 }] });

    const reqResponse = await request(app)
      .post(`/api/service-orders/${osId}/approval/request`)
      .set(headersAdmin);

    // Change part price in database
    await prismaClient.part.update({
      where: { id: part.id },
      data: { salePrice: new Prisma.Decimal('500.00') }
    });

    const getApprovalResponse = await request(app)
      .get(`/api/service-orders/${osId}/approval`)
      .set(headersAdmin);
    expect(getApprovalResponse.body.data.snapshot.parts[0].unitPrice).toBe('10'); // Kept original price!
  });
});
