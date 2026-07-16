import request from 'supertest';
import app from '../../src/app';
import { FactoryEngine } from '../factories/FactoryEngine';
import { generateAuthHeaders } from '../helpers/auth';
import { prismaClient } from '../../src/shared/database/prismaClient';
import { Prisma } from '@prisma/client';

describe('Service Order Technical Execution (P4.5)', () => {
  let company: any;
  let branch: any;
  let admin: any;
  let manager: any;
  let mechanic1: any;
  let mechanic2: any;
  let attendant: any;
  let client: any;
  let vehicle: any;
  let part: any;
  let stockBefore: any;

  let headersAdmin: any;
  let headersManager: any;
  let headersMechanic1: any;
  let headersMechanic2: any;
  let headersAttendant: any;

  beforeEach(async () => {
    company = await FactoryEngine.createCompany();
    branch = await FactoryEngine.createBranch(company.id);

    admin = await FactoryEngine.createUser(company.id, { role: 'ADMIN', branchId: branch.id });
    manager = await FactoryEngine.createUser(company.id, { role: 'MANAGER', branchId: branch.id });
    mechanic1 = await FactoryEngine.createUser(company.id, { role: 'MECHANIC', branchId: branch.id });
    mechanic2 = await FactoryEngine.createUser(company.id, { role: 'MECHANIC', branchId: branch.id });
    attendant = await FactoryEngine.createUser(company.id, { role: 'ATTENDANT', branchId: branch.id });

    client = await FactoryEngine.createClient(company.id);
    vehicle = await FactoryEngine.createVehicle(company.id, client.id);

    part = await FactoryEngine.createPart(company.id, { salePrice: new Prisma.Decimal('10.00'), name: 'Spark Plug' } as any);
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
    headersMechanic1 = generateAuthHeaders(mechanic1);
    headersMechanic2 = generateAuthHeaders(mechanic2);
    headersAttendant = generateAuthHeaders(attendant);
  });

  async function createOSWithService(approvedStatus?: 'APPROVED' | 'PENDING' | 'REJECTED' | 'INVALIDATED') {
    // Create OS
    const createResponse = await request(app)
      .post('/api/service-orders')
      .set(headersAdmin)
      .send({ clientId: client.id, vehicleId: vehicle.id, branchId: branch.id });
    const osId = createResponse.body.data.id;

    // Add service
    const itemResponse = await request(app)
      .post(`/api/service-orders/${osId}/items`)
      .set(headersAdmin)
      .send({ services: [{ description: 'Oil Change', quantity: 1, unitPrice: '80.00' }] });

    const serviceId = itemResponse.body.data.services[0].id;

    if (approvedStatus) {
      // Request approval
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
          .send({ approvalId, reason: 'Orçamento muito caro' });
      } else if (approvedStatus === 'INVALIDATED') {
        await request(app)
          .post(`/api/service-orders/${osId}/approval/approve`)
          .set(headersManager)
          .send({ approvalId });

        await request(app)
          .post(`/api/service-orders/${osId}/approval/invalidate`)
          .set(headersManager)
          .send({ approvalId, reason: 'Mudança de escopo técnico' });
      }
    }

    return { osId, serviceId };
  }

  it('should block execution actions if there is no budget approval', async () => {
    const { osId, serviceId } = await createOSWithService(); // No approval at all

    const res = await request(app)
      .post(`/api/service-orders/${osId}/services/${serviceId}/assign`)
      .set(headersAdmin)
      .send({ technicianId: mechanic1.id });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('aprovado');
  });

  it('should block execution actions if budget approval status is not APPROVED', async () => {
    const { osId, serviceId } = await createOSWithService('PENDING');

    const res = await request(app)
      .post(`/api/service-orders/${osId}/services/${serviceId}/assign`)
      .set(headersAdmin)
      .send({ technicianId: mechanic1.id });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('APPROVED');
  });

  it('should block execution actions if budget approval status is REJECTED', async () => {
    const { osId, serviceId } = await createOSWithService('REJECTED');

    const res = await request(app)
      .post(`/api/service-orders/${osId}/services/${serviceId}/assign`)
      .set(headersAdmin)
      .send({ technicianId: mechanic1.id });

    expect(res.status).toBe(400);
  });

  it('should block execution actions if budget approval status is INVALIDATED', async () => {
    const { osId, serviceId } = await createOSWithService('INVALIDATED');

    const res = await request(app)
      .post(`/api/service-orders/${osId}/services/${serviceId}/assign`)
      .set(headersAdmin)
      .send({ technicianId: mechanic1.id });

    expect(res.status).toBe(400);
  });

  it('should block assigning technician belonging to another company (tenant isolation)', async () => {
    const { osId, serviceId } = await createOSWithService('APPROVED');

    // Create technician in another company
    const foreignCompany = await FactoryEngine.createCompany();
    const foreignTech = await FactoryEngine.createUser(foreignCompany.id, { role: 'MECHANIC' });

    const res = await request(app)
      .post(`/api/service-orders/${osId}/services/${serviceId}/assign`)
      .set(headersAdmin)
      .send({ technicianId: foreignTech.id });

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('Técnico');
  });

  it('should block assigning user with invalid role as technician', async () => {
    const { osId, serviceId } = await createOSWithService('APPROVED');

    const res = await request(app)
      .post(`/api/service-orders/${osId}/services/${serviceId}/assign`)
      .set(headersAdmin)
      .send({ technicianId: attendant.id }); // Attendant is not a MECHANIC

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('MECHANIC');
  });

  it('should block execution actions on service not present in the approved snapshot', async () => {
    const { osId, serviceId } = await createOSWithService('APPROVED');

    // Manually add another service without updating the snapshot (which is blocked by logic, so we bypass in db directly)
    const newSvc = await prismaClient.oSService.create({
      data: {
        serviceOrderId: osId,
        name: 'Unapproved extra service',
        price: 200.00
      }
    });

    const res = await request(app)
      .post(`/api/service-orders/${osId}/services/${newSvc.id}/assign`)
      .set(headersAdmin)
      .send({ technicianId: mechanic1.id });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('não consta no orçamento aprovado');
  });

  it('should perform execution lifecycle successfully (assign, start, pause, resume, complete)', async () => {
    const { osId, serviceId } = await createOSWithService('APPROVED');

    // 1. Assign
    const assignRes = await request(app)
      .post(`/api/service-orders/${osId}/services/${serviceId}/assign`)
      .set(headersAdmin)
      .send({ technicianId: mechanic1.id });
    expect(assignRes.status).toBe(200);
    expect(assignRes.body.data.executionStatus).toBe('ASSIGNED');
    expect(assignRes.body.data.technicianId).toBe(mechanic1.id);
    expect(assignRes.body.data.assignedById).toBe(admin.id);

    // 2. Start
    const startRes = await request(app)
      .post(`/api/service-orders/${osId}/services/${serviceId}/start`)
      .set(headersMechanic1);
    expect(startRes.status).toBe(200);
    expect(startRes.body.data.executionStatus).toBe('IN_PROGRESS');
    expect(startRes.body.data.startedById).toBe(mechanic1.id);

    // Try starting again (should conflict)
    const startDup = await request(app)
      .post(`/api/service-orders/${osId}/services/${serviceId}/start`)
      .set(headersMechanic1);
    expect(startDup.status).toBe(409);

    // 3. Pause
    const pauseRes = await request(app)
      .post(`/api/service-orders/${osId}/services/${serviceId}/pause`)
      .set(headersMechanic1)
      .send({ reason: 'Aguardando elevador técnico' });
    expect(pauseRes.status).toBe(200);
    expect(pauseRes.body.data.executionStatus).toBe('PAUSED');
    expect(pauseRes.body.data.pauseReason).toBe('Aguardando elevador técnico');

    // Try pausing again (should conflict)
    const pauseDup = await request(app)
      .post(`/api/service-orders/${osId}/services/${serviceId}/pause`)
      .set(headersMechanic1)
      .send({ reason: 'Another reason' });
    expect(pauseDup.status).toBe(409);

    // 4. Resume
    const resumeRes = await request(app)
      .post(`/api/service-orders/${osId}/services/${serviceId}/resume`)
      .set(headersMechanic1);
    expect(resumeRes.status).toBe(200);
    expect(resumeRes.body.data.executionStatus).toBe('IN_PROGRESS');

    // Try resuming again when not paused (should conflict)
    const resumeDup = await request(app)
      .post(`/api/service-orders/${osId}/services/${serviceId}/resume`)
      .set(headersMechanic1);
    expect(resumeDup.status).toBe(409);

    // 5. Complete
    const completeRes = await request(app)
      .post(`/api/service-orders/${osId}/services/${serviceId}/complete`)
      .set(headersMechanic1)
      .send({ notes: 'Concluído com sucesso' });
    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.executionStatus).toBe('COMPLETED');
    expect(completeRes.body.data.completionNotes).toBe('Concluído com sucesso');
  });

  it('should block non-assigned mechanics from managing execution', async () => {
    const { osId, serviceId } = await createOSWithService('APPROVED');

    // Assign to mechanic 1
    await request(app)
      .post(`/api/service-orders/${osId}/services/${serviceId}/assign`)
      .set(headersAdmin)
      .send({ technicianId: mechanic1.id });

    // Mechanic 2 tries to start (should be blocked)
    const res = await request(app)
      .post(`/api/service-orders/${osId}/services/${serviceId}/start`)
      .set(headersMechanic2);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('atribuídos a você');
  });

  it('should verify isolation: stock, inventory movement, financial records, and OS general status do not change', async () => {
    const { osId, serviceId } = await createOSWithService('APPROVED');

    await request(app)
      .post(`/api/service-orders/${osId}/services/${serviceId}/assign`)
      .set(headersAdmin)
      .send({ technicianId: mechanic1.id });

    await request(app)
      .post(`/api/service-orders/${osId}/services/${serviceId}/start`)
      .set(headersMechanic1);

    await request(app)
      .post(`/api/service-orders/${osId}/services/${serviceId}/complete`)
      .set(headersMechanic1);

    // Check stock
    const stockAfter = await prismaClient.stock.findUnique({
      where: { id: stockBefore.id }
    });
    expect(stockAfter?.quantity).toBe(10); // Unchanged!

    // Check inventory movement
    const movements = await prismaClient.inventoryMovement.findMany({
      where: { branchId: branch.id }
    });
    expect(movements.length).toBe(0); // Unchanged!

    // Check financial record
    const financial = await prismaClient.financialRecord.findMany({
      where: { companyId: company.id }
    });
    expect(financial.length).toBe(0); // Unchanged!

    // Check OS general status
    const os = await prismaClient.serviceOrder.findUnique({
      where: { id: osId }
    });
    expect(os?.status).toBe('OPEN'); // Unchanged (not completed automatically)!
  });
});
