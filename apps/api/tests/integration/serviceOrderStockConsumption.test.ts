import request from 'supertest';
import app from '../../src/app';
import { FactoryEngine } from '../factories/FactoryEngine';
import { generateAuthHeaders } from '../helpers/auth';
import { prismaClient } from '../../src/shared/database/prismaClient';
import { Prisma } from '@prisma/client';
import { crypto } from '../../src/shared/utils/crypto'; // Wait, let's check how to generate UUID or if we can use crypto.randomUUID() or a simple uuid generator. Node has global crypto or require('crypto')

const { randomUUID } = require('crypto');

describe('Service Order Stock Consumption (P4.6)', () => {
  let company: any;
  let branch: any;
  let admin: any;
  let manager: any;
  let stockist: any;
  let mechanic1: any;
  let attendant: any;
  let financial: any;
  let client: any;
  let vehicle: any;
  let part: any;
  let stockBefore: any;

  let headersAdmin: any;
  let headersManager: any;
  let headersStockist: any;
  let headersMechanic1: any;
  let headersAttendant: any;
  let headersFinancial: any;

  beforeEach(async () => {
    company = await FactoryEngine.createCompany();
    branch = await FactoryEngine.createBranch(company.id);

    admin = await FactoryEngine.createUser(company.id, { role: 'ADMIN', branchId: branch.id });
    manager = await FactoryEngine.createUser(company.id, { role: 'MANAGER', branchId: branch.id });
    stockist = await FactoryEngine.createUser(company.id, { role: 'STOCKIST', branchId: branch.id });
    mechanic1 = await FactoryEngine.createUser(company.id, { role: 'MECHANIC', branchId: branch.id });
    attendant = await FactoryEngine.createUser(company.id, { role: 'ATTENDANT', branchId: branch.id });
    financial = await FactoryEngine.createUser(company.id, { role: 'FINANCIAL', branchId: branch.id });

    client = await FactoryEngine.createClient(company.id);
    vehicle = await FactoryEngine.createVehicle(company.id, client.id);

    part = await FactoryEngine.createPart(company.id, { salePrice: new Prisma.Decimal('15.00'), name: 'Air Filter' } as any);
    stockBefore = await prismaClient.stock.create({
      data: {
        companyId: company.id,
        branchId: branch.id,
        partId: part.id,
        quantity: 10
      }
    });

    headersAdmin = generateAuthHeaders(admin);
    headersManager = generateAuthHeaders(manager);
    headersStockist = generateAuthHeaders(stockist);
    headersMechanic1 = generateAuthHeaders(mechanic1);
    headersAttendant = generateAuthHeaders(attendant);
    headersFinancial = generateAuthHeaders(financial);
  });

  async function createOSWithExecutionState(approvedStatus: 'APPROVED' | 'PENDING' | 'REJECTED' | 'INVALIDATED' = 'APPROVED') {
    // 1. Create OS
    const createResponse = await request(app)
      .post('/api/service-orders')
      .set(headersAdmin)
      .send({ clientId: client.id, vehicleId: vehicle.id, branchId: branch.id });
    const osId = createResponse.body.data.id;

    // 2. Add Part & Service
    const itemResponse = await request(app)
      .post(`/api/service-orders/${osId}/items`)
      .set(headersAdmin)
      .send({
        parts: [{ stockId: stockBefore.id, quantity: 4 }],
        services: [{ description: 'Oil Change', quantity: 1, unitPrice: '80.00' }]
      });

    const osPartId = itemResponse.body.data.parts[0].id;
    const serviceId = itemResponse.body.data.services[0].id;

    // 3. Approval request
    const reqResponse = await request(app)
      .post(`/api/service-orders/${osId}/approval/request`)
      .set(headersAdmin);
    const approvalId = reqResponse.body.data.id;

    if (approvedStatus === 'APPROVED') {
      await request(app)
        .post(`/api/service-orders/${osId}/approval/approve`)
        .set(headersManager)
        .send({ approvalId });
    } else if (approvedStatus === 'REJECTED') {
      await request(app)
        .post(`/api/service-orders/${osId}/approval/reject`)
        .set(headersManager)
        .send({ approvalId, reason: 'Rejeitado por motivos de teste' });
    } else if (approvedStatus === 'INVALIDATED') {
      await request(app)
        .post(`/api/service-orders/${osId}/approval/approve`)
        .set(headersManager)
        .send({ approvalId });

      await request(app)
        .post(`/api/service-orders/${osId}/approval/invalidate`)
        .set(headersManager)
        .send({ approvalId, reason: 'Mudança no escopo técnica' });
    }

    // 4. Set execution state (assign and start)
    await request(app)
      .post(`/api/service-orders/${osId}/services/${serviceId}/assign`)
      .set(headersAdmin)
      .send({ technicianId: mechanic1.id });

    await request(app)
      .post(`/api/service-orders/${osId}/services/${serviceId}/start`)
      .set(headersMechanic1);

    return { osId, osPartId, serviceId };
  }

  it('should list parts planned and their consumption status', async () => {
    const { osId } = await createOSWithExecutionState('APPROVED');

    const res = await request(app)
      .get(`/api/service-orders/${osId}/parts/consumption`)
      .set(headersAdmin);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].plannedQuantity).toBe(4);
    expect(res.body.data[0].consumedQuantity).toBe(0);
    expect(res.body.data[0].remainingQuantity).toBe(4);
    expect(res.body.data[0].availableStock).toBe(10);
  });

  it('should consume parts and reduce physical stock', async () => {
    const { osId, osPartId } = await createOSWithExecutionState('APPROVED');
    const key = randomUUID();

    const res = await request(app)
      .post(`/api/service-orders/${osId}/parts/${osPartId}/consume`)
      .set(headersAdmin)
      .set('Idempotency-Key', key)
      .send({ quantity: 2 });

    expect(res.status).toBe(200);
    expect(res.body.data.consumedQuantity).toBe(2);
    expect(res.body.data.remainingQuantity).toBe(2);
    expect(res.body.data.availableStock).toBe(8);

    // Verify Stock reduced in DB
    const stock = await prismaClient.stock.findFirst({
      where: { partId: part.id, branchId: branch.id }
    });
    expect(stock?.quantity).toBe(8);

    // Verify InventoryMovement created
    const movement = await prismaClient.inventoryMovement.findUnique({
      where: { idempotencyKey: key }
    });
    expect(movement).toBeDefined();
    expect(movement?.type).toBe('OUT');
    expect(movement?.quantity).toBe(2);
    expect(movement?.serviceOrderId).toBe(osId);
    expect(movement?.osPartId).toBe(osPartId);
    expect(movement?.userId).toBe(admin.id);
  });

  it('should handle partial consumption progressively', async () => {
    const { osId, osPartId } = await createOSWithExecutionState('APPROVED');

    // First consumption: 1 unit
    await request(app)
      .post(`/api/service-orders/${osId}/parts/${osPartId}/consume`)
      .set(headersAdmin)
      .set('Idempotency-Key', randomUUID())
      .send({ quantity: 1 });

    // Second consumption: 2 units
    const res = await request(app)
      .post(`/api/service-orders/${osId}/parts/${osPartId}/consume`)
      .set(headersAdmin)
      .set('Idempotency-Key', randomUUID())
      .send({ quantity: 2 });

    expect(res.status).toBe(200);
    expect(res.body.data.consumedQuantity).toBe(3);
    expect(res.body.data.remainingQuantity).toBe(1);
    expect(res.body.data.availableStock).toBe(7);
  });

  it('should not allow consuming above remaining planned quantity', async () => {
    const { osId, osPartId } = await createOSWithExecutionState('APPROVED');

    const res = await request(app)
      .post(`/api/service-orders/${osId}/parts/${osPartId}/consume`)
      .set(headersAdmin)
      .set('Idempotency-Key', randomUUID())
      .send({ quantity: 5 }); // 4 is planned

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('excede a quantidade planejada restante');
  });

  it('should not allow consuming above available stock', async () => {
    // Set stock to 2
    await prismaClient.stock.update({
      where: { id: stockBefore.id },
      data: { quantity: 2 }
    });

    const { osId, osPartId } = await createOSWithExecutionState('APPROVED');

    const res = await request(app)
      .post(`/api/service-orders/${osId}/parts/${osPartId}/consume`)
      .set(headersAdmin)
      .set('Idempotency-Key', randomUUID())
      .send({ quantity: 3 }); // 4 is planned but only 2 in stock

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Saldo insuficiente em estoque');
  });

  it('should enforce idempotency by returning existing movement data', async () => {
    const { osId, osPartId } = await createOSWithExecutionState('APPROVED');
    const key = randomUUID();

    // Call 1
    const res1 = await request(app)
      .post(`/api/service-orders/${osId}/parts/${osPartId}/consume`)
      .set(headersAdmin)
      .set('Idempotency-Key', key)
      .send({ quantity: 2 });

    // Call 2 (reusing key)
    const res2 = await request(app)
      .post(`/api/service-orders/${osId}/parts/${osPartId}/consume`)
      .set(headersAdmin)
      .set('Idempotency-Key', key)
      .send({ quantity: 2 });

    expect(res2.status).toBe(200);
    expect(res2.body.data.consumedQuantity).toBe(res1.body.data.consumedQuantity);
    expect(res2.body.data.availableStock).toBe(res1.body.data.availableStock);

    // Verify stock only decremented once
    const stock = await prismaClient.stock.findFirst({
      where: { partId: part.id, branchId: branch.id }
    });
    expect(stock?.quantity).toBe(8); // 10 - 2, not 10 - 4
  });

  it('should block idempotency key reuse on different parts', async () => {
    const { osId, osPartId } = await createOSWithExecutionState('APPROVED');
    const key = randomUUID();

    await request(app)
      .post(`/api/service-orders/${osId}/parts/${osPartId}/consume`)
      .set(headersAdmin)
      .set('Idempotency-Key', key)
      .send({ quantity: 1 });

    const res = await request(app)
      .post(`/api/service-orders/${osId}/parts/different-part-id/consume`)
      .set(headersAdmin)
      .set('Idempotency-Key', key)
      .send({ quantity: 1 });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('Chave de idempotência já utilizada');
  });

  it('should enforce RBAC rules for stock consumption', async () => {
    const { osId, osPartId } = await createOSWithExecutionState('APPROVED');

    // ATTENDANT has SERVICE_ORDER_STOCK_VIEW but NOT STOCK_CONSUME
    const resView = await request(app)
      .get(`/api/service-orders/${osId}/parts/consumption`)
      .set(headersAttendant);
    expect(resView.status).toBe(200);

    const resConsume = await request(app)
      .post(`/api/service-orders/${osId}/parts/${osPartId}/consume`)
      .set(headersAttendant)
      .set('Idempotency-Key', randomUUID())
      .send({ quantity: 1 });
    expect(resConsume.status).toBe(403); // Forbidden
  });

  it('should not allow consuming stock if budget approval is not APPROVED', async () => {
    const { osId, osPartId } = await createOSWithExecutionState('PENDING');

    const res = await request(app)
      .post(`/api/service-orders/${osId}/parts/${osPartId}/consume`)
      .set(headersAdmin)
      .set('Idempotency-Key', randomUUID())
      .send({ quantity: 1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('O consumo de peças só é permitido após o início da execução da Ordem de Serviço');
  });
});
