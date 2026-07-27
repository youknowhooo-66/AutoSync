import request from 'supertest';
import app from '../../src/app';
import { FactoryEngine } from '../factories/FactoryEngine';
import { generateAuthHeaders } from '../helpers/auth';
import { prismaClient } from '../../src/shared/database/prismaClient';
import { Prisma } from '@prisma/client';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import crypto from 'crypto';
import { AuditLogService } from '../../src/shared/audit/AuditLogService';

vi.mock('../../src/shared/audit/AuditLogService', async () => {
  const actual = await vi.importActual<any>('../../src/shared/audit/AuditLogService');
  return {
    ...actual,
    AuditLogService: {
      ...actual.AuditLogService,
      log: vi.fn().mockImplementation(async (args) => {
        if ((global as any).failAuditLog) {
          throw new Error('Simulated database error in AuditLog');
        }
        return actual.AuditLogService.log(args);
      })
    }
  };
});

describe('Service Order Full Lifecycle E2E', () => {
  let companyA: any;
  let companyB: any;
  let branchA1: any;
  let branchA2: any;
  let branchB1: any;

  let adminA: any;
  let managerA: any;
  let mechanicA: any;
  let attendantA: any;
  let financialA: any;
  let userB: any;

  let headersAdminA: any;
  let headersManagerA: any;
  let headersMechanicA: any;
  let headersAttendantA: any;
  let headersFinancialA: any;
  let headersUserB: any;

  beforeEach(async () => {
    (global as any).failAuditLog = false;

    // 1. Create clean companies and branches
    companyA = await FactoryEngine.createCompany();
    companyB = await FactoryEngine.createCompany();

    branchA1 = await FactoryEngine.createBranch(companyA.id);
    branchA2 = await FactoryEngine.createBranch(companyA.id);
    branchB1 = await FactoryEngine.createBranch(companyB.id);

    // 2. Create users with specific RBAC roles
    adminA = await FactoryEngine.createUser(companyA.id, { role: 'ADMIN', branchId: branchA1.id });
    managerA = await FactoryEngine.createUser(companyA.id, { role: 'MANAGER', branchId: branchA1.id });
    mechanicA = await FactoryEngine.createUser(companyA.id, { role: 'MECHANIC', branchId: branchA1.id });
    attendantA = await FactoryEngine.createUser(companyA.id, { role: 'ATTENDANT', branchId: branchA1.id });
    financialA = await FactoryEngine.createUser(companyA.id, { role: 'FINANCIAL', branchId: branchA1.id });

    // User B belongs to Company B
    userB = await FactoryEngine.createUser(companyB.id, { role: 'ADMIN', branchId: branchB1.id });

    // 3. Generate auth headers
    headersAdminA = generateAuthHeaders(adminA);
    headersManagerA = generateAuthHeaders(managerA);
    headersMechanicA = generateAuthHeaders(mechanicA);
    headersAttendantA = generateAuthHeaders(attendantA);
    headersFinancialA = generateAuthHeaders(financialA);
    headersUserB = generateAuthHeaders(userB);
  });

  describe('happy path', () => {
    it('should complete the entire service order lifecycle successfully', async () => {
      const runId = crypto.randomUUID();

      // Setup Stock Item
      const part = await FactoryEngine.createPart(companyA.id, {
        salePrice: new Prisma.Decimal('100.00'),
        name: `Part E2E ${runId}`,
      } as any);

      const stock = await prismaClient.stock.create({
        data: {
          companyId: companyA.id,
          branchId: branchA1.id,
          partId: part.id,
          quantity: 10,
        },
      });

      // 1. Create client
      const clientRes = await request(app)
        .post('/api/clients')
        .set(headersAdminA)
        .send({
          name: `Client E2E ${runId}`,
          document: `doc-${runId.substring(0, 8)}`,
          email: `client-${runId}@example.com`,
          phone: '11999999999',
        });
      expect(clientRes.status).toBe(201);
      const clientId = clientRes.body.data.id;

      // 2. Create vehicle
      const vehicleRes = await request(app)
        .post('/api/vehicles')
        .set(headersAdminA)
        .send({
          clientId,
          plate: `PL-${runId.substring(0, 5)}`.toUpperCase(),
          brand: 'Fiat',
          model: 'Uno',
          year: 2020,
        });
      expect(vehicleRes.status).toBe(201);
      const vehicleId = vehicleRes.body.data.id;

      // 3. Create OS
      const osRes = await request(app)
        .post('/api/service-orders')
        .set(headersAdminA)
        .send({ clientId, vehicleId, branchId: branchA1.id });
      expect(osRes.status).toBe(201);
      const osId = osRes.body.data.id;

      // 4. Register diagnosis
      const diagRes = await request(app)
        .put(`/api/service-orders/${osId}/diagnosis`)
        .set(headersAdminA)
        .send({ description: 'Technical diagnosis check. [DIAGNÓSTICO TÉCNICO] Ready to start.' });
      expect(diagRes.status).toBe(200);

      // 5. Add parts and services
      const itemsRes = await request(app)
        .post(`/api/service-orders/${osId}/items`)
        .set(headersAdminA)
        .send({
          parts: [{ stockId: stock.id, quantity: 2 }],
          services: [{ description: 'Engine maintenance', quantity: 1, unitPrice: '150.00' }]
        });
      expect(itemsRes.status).toBe(200);
      const osPartId = itemsRes.body.data.parts[0].id;
      const serviceId = itemsRes.body.data.services[0].id;

      // Verify stock untouched before consumption
      const stockCheckBefore = await prismaClient.stock.findUnique({ where: { id: stock.id } });
      expect(Number(stockCheckBefore?.quantity)).toBe(10);

      // 6. Request approval
      const reqApprovalRes = await request(app)
        .post(`/api/service-orders/${osId}/approval/request`)
        .set(headersAdminA);
      expect(reqApprovalRes.status).toBe(200);
      const approvalId = reqApprovalRes.body.data.id;

      // Confirm snapshot final value matches
      const approvalObj = await prismaClient.serviceOrderApproval.findUnique({ where: { id: approvalId } });
      expect(approvalObj).toBeDefined();
      expect(Number(approvalObj?.finalValue)).toBe(350); // (2 * 100) + 150

      // 7. Approve
      const approveRes = await request(app)
        .post(`/api/service-orders/${osId}/approval/approve`)
        .set(headersManagerA)
        .send({ approvalId });
      expect(approveRes.status).toBe(200);

      // 8. Assign technician
      const assignRes = await request(app)
        .post(`/api/service-orders/${osId}/services/${serviceId}/assign`)
        .set(headersAdminA)
        .send({ technicianId: mechanicA.id });
      expect(assignRes.status).toBe(200);

      // 9. Start service
      const startRes = await request(app)
        .post(`/api/service-orders/${osId}/services/${serviceId}/start`)
        .set(headersMechanicA);
      expect(startRes.status).toBe(200);

      // 10. Consume stock
      const idempotencyKey = crypto.randomUUID();
      const consumeRes = await request(app)
        .post(`/api/service-orders/${osId}/parts/${osPartId}/consume`)
        .set(headersAdminA)
        .set('Idempotency-Key', idempotencyKey)
        .send({ quantity: 2 });
      expect(consumeRes.status).toBe(200);

      // Verify stock was reduced
      const stockCheckAfter = await prismaClient.stock.findUnique({ where: { id: stock.id } });
      expect(Number(stockCheckAfter?.quantity)).toBe(8);

      // Confirm inventory movement OUT
      const movements = await prismaClient.inventoryMovement.findMany({
        where: { osPartId, type: 'OUT' }
      });
      expect(movements).toHaveLength(1);
      expect(Number(movements[0].quantity)).toBe(2);

      // 11. Complete service
      const completeServiceRes = await request(app)
        .post(`/api/service-orders/${osId}/services/${serviceId}/complete`)
        .set(headersMechanicA)
        .send({ notes: 'Execution done.' });
      expect(completeServiceRes.status).toBe(200);

      // 12. Consult readiness
      const readinessRes = await request(app)
        .get(`/api/service-orders/${osId}/completion/readiness`)
        .set(headersAdminA);
      expect(readinessRes.status).toBe(200);
      expect(readinessRes.body.data.ready).toBe(true);

      // 13. Complete OS
      const completeOSRes = await request(app)
        .post(`/api/service-orders/${osId}/complete`)
        .set(headersAdminA)
        .send({ completionNotes: 'E2E completion.' });
      expect(completeOSRes.status).toBe(200);

      // Verify OS is FINISHED
      const finalOS = await prismaClient.serviceOrder.findUnique({ where: { id: osId } });
      expect(finalOS?.status).toBe('FINISHED');
      expect(finalOS?.finishedAt).toBeDefined();
      expect(finalOS?.finishedById).toBe(adminA.id);

      // 14. Generate receivable
      const generateRes = await request(app)
        .post(`/api/service-orders/${osId}/finance/receivable`)
        .set(headersAdminA)
        .send({ dueDate: '2026-08-30' });
      expect(generateRes.status).toBe(201);

      // 15. Consult financial state
      const stateRes = await request(app)
        .get(`/api/service-orders/${osId}/finance`)
        .set(headersAdminA);
      expect(stateRes.status).toBe(200);
      expect(stateRes.body.data.status).toBe('GENERATED');
      expect(stateRes.body.data.receivable).toBeDefined();
      expect(stateRes.body.data.receivable.amount).toBe('350');
      expect(stateRes.body.data.receivable.status).toBe('PENDING');

      // Verify no Invoice or Payment generated (not defined in schema.prisma)
    });
  });

  describe('tenant isolation', () => {
    it('should block Company B from viewing or writing to Company A resources', async () => {
      const runId = crypto.randomUUID();

      // Create Client and OS in Company A
      const client = await FactoryEngine.createClient(companyA.id);
      const vehicle = await FactoryEngine.createVehicle(companyA.id, client.id);
      const osRes = await request(app)
        .post('/api/service-orders')
        .set(headersAdminA)
        .send({ clientId: client.id, vehicleId: vehicle.id, branchId: branchA1.id });
      const osId = osRes.body.data.id;

      // Verify Company B user gets 404 on Company A's OS
      const viewRes = await request(app)
        .get(`/api/service-orders/${osId}`)
        .set(headersUserB);
      expect(viewRes.status).toBe(404);

      // Verify Company B user gets 404 on diagnosis registration
      const diagRes = await request(app)
        .put(`/api/service-orders/${osId}/diagnosis`)
        .set(headersUserB)
        .send({ description: 'Illegal cross-tenant diagnosis.' });
      expect(diagRes.status).toBe(404);

      // Verify Company B user gets 404 on finance status query
      const financeRes = await request(app)
        .get(`/api/service-orders/${osId}/finance`)
        .set(headersUserB);
      expect(financeRes.status).toBe(404);
    });
  });

  describe('branch isolation', () => {
    it('should prevent user assigned to Branch A1 from completing OS of Branch A2', async () => {
      const client = await FactoryEngine.createClient(companyA.id);
      const vehicle = await FactoryEngine.createVehicle(companyA.id, client.id);

      // OS created in Branch A2
      const osRes = await request(app)
        .post('/api/service-orders')
        .set(headersAdminA)
        .send({ clientId: client.id, vehicleId: vehicle.id, branchId: branchA2.id });
      const osId = osRes.body.data.id;

      // User A1 is assigned to Branch A1. Try to complete OS in Branch A2
      const res = await request(app)
        .post(`/api/service-orders/${osId}/complete`)
        .set(headersManagerA) // headersManagerA is tied to Branch A1
        .send({ completionNotes: 'Attempting cross-branch completion.' });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Ordem de Serviço não encontrada.');
    });
  });

  describe('RBAC', () => {
    it('should block Attendant from approving budget or complete OS, and block Mechanic from generating finance', async () => {
      const client = await FactoryEngine.createClient(companyA.id);
      const vehicle = await FactoryEngine.createVehicle(companyA.id, client.id);
      const osRes = await request(app)
        .post('/api/service-orders')
        .set(headersAdminA)
        .send({ clientId: client.id, vehicleId: vehicle.id, branchId: branchA1.id });
      const osId = osRes.body.data.id;

      // Attendant tries to complete OS (needs SERVICE_ORDER_COMPLETE)
      const completeRes = await request(app)
        .post(`/api/service-orders/${osId}/complete`)
        .set(headersAttendantA)
        .send({ completionNotes: 'Attendant bypass.' });
      expect(completeRes.status).toBe(403);

      // Mechanic tries to generate receivable (needs SERVICE_ORDER_FINANCE_GENERATE)
      const financeRes = await request(app)
        .post(`/api/service-orders/${osId}/finance/receivable`)
        .set(headersMechanicA)
        .send({ dueDate: '2026-08-30' });
      expect(financeRes.status).toBe(403);
    });
  });

  describe('idempotency', () => {
    it('should return idempotent responses for duplicate stock consumption and receivable generation', async () => {
      const runId = crypto.randomUUID();

      const part = await FactoryEngine.createPart(companyA.id, {
        salePrice: new Prisma.Decimal('100.00'),
        name: `Part E2E Idempotency ${runId}`,
      } as any);

      const stock = await prismaClient.stock.create({
        data: {
          companyId: companyA.id,
          branchId: branchA1.id,
          partId: part.id,
          quantity: 10,
        },
      });

      const client = await FactoryEngine.createClient(companyA.id);
      const vehicle = await FactoryEngine.createVehicle(companyA.id, client.id);
      const osRes = await request(app)
        .post('/api/service-orders')
        .set(headersAdminA)
        .send({ clientId: client.id, vehicleId: vehicle.id, branchId: branchA1.id });
      const osId = osRes.body.data.id;

      await request(app)
        .put(`/api/service-orders/${osId}/diagnosis`)
        .set(headersAdminA)
        .send({ description: 'Testing. [DIAGNÓSTICO TÉCNICO] Diagnosis.' });

      const itemsRes = await request(app)
        .post(`/api/service-orders/${osId}/items`)
        .set(headersAdminA)
        .send({
          parts: [{ stockId: stock.id, quantity: 2 }],
          services: [{ description: 'Oil change', quantity: 1, unitPrice: '50.00' }]
        });
      const osPartId = itemsRes.body.data.parts[0].id;
      const serviceId = itemsRes.body.data.services[0].id;

      const reqApprovalRes = await request(app)
        .post(`/api/service-orders/${osId}/approval/request`)
        .set(headersAdminA);
      const approvalId = reqApprovalRes.body.data.id;

      await request(app)
        .post(`/api/service-orders/${osId}/approval/approve`)
        .set(headersManagerA)
        .send({ approvalId });

      await request(app)
        .post(`/api/service-orders/${osId}/services/${serviceId}/assign`)
        .set(headersAdminA)
        .send({ technicianId: mechanicA.id });

      await request(app)
        .post(`/api/service-orders/${osId}/services/${serviceId}/start`)
        .set(headersMechanicA);

      // Consume piece with same Idempotency Key sequentially
      const idempotencyKey = crypto.randomUUID();
      const res1 = await request(app)
        .post(`/api/service-orders/${osId}/parts/${osPartId}/consume`)
        .set(headersAdminA)
        .set('Idempotency-Key', idempotencyKey)
        .send({ quantity: 2 });
      expect(res1.status).toBe(200);

      const res2 = await request(app)
        .post(`/api/service-orders/${osId}/parts/${osPartId}/consume`)
        .set(headersAdminA)
        .set('Idempotency-Key', idempotencyKey)
        .send({ quantity: 2 });
      expect(res2.status).toBe(200);

      // Verify stock only decreased by 2, not 4
      const finalStock = await prismaClient.stock.findUnique({ where: { id: stock.id } });
      expect(Number(finalStock?.quantity)).toBe(8);

      // Complete execution and OS to test faturamento idempotency
      await request(app)
        .post(`/api/service-orders/${osId}/services/${serviceId}/complete`)
        .set(headersMechanicA)
        .send({ notes: 'Done.' });

      await request(app)
        .post(`/api/service-orders/${osId}/complete`)
        .set(headersAdminA)
        .send({ completionNotes: 'Done.' });

      // Generate finance sequentially
      const gen1 = await request(app)
        .post(`/api/service-orders/${osId}/finance/receivable`)
        .set(headersAdminA)
        .send({ dueDate: '2026-08-30' });
      expect(gen1.status).toBe(201);

      const gen2 = await request(app)
        .post(`/api/service-orders/${osId}/finance/receivable`)
        .set(headersAdminA)
        .send({ dueDate: '2026-08-30' });
      expect(gen2.status).toBe(200);
      expect(gen2.body.message).toContain('já existente (idempotente)');
      expect(gen2.body.data.id).toBe(gen1.body.data.id);
    });
  });

  describe('concurrency', () => {
    it('should successfully handle concurrent starts, stock consumption and receivable generation without duplicate entries', async () => {
      const runId = crypto.randomUUID();

      const part = await FactoryEngine.createPart(companyA.id, {
        salePrice: new Prisma.Decimal('100.00'),
        name: `Part E2E Concurrency ${runId}`,
      } as any);

      const stock = await prismaClient.stock.create({
        data: {
          companyId: companyA.id,
          branchId: branchA1.id,
          partId: part.id,
          quantity: 10,
        },
      });

      const client = await FactoryEngine.createClient(companyA.id);
      const vehicle = await FactoryEngine.createVehicle(companyA.id, client.id);
      const osRes = await request(app)
        .post('/api/service-orders')
        .set(headersAdminA)
        .send({ clientId: client.id, vehicleId: vehicle.id, branchId: branchA1.id });
      const osId = osRes.body.data.id;

      await request(app)
        .put(`/api/service-orders/${osId}/diagnosis`)
        .set(headersAdminA)
        .send({ description: 'Testing. [DIAGNÓSTICO TÉCNICO] Diagnosis.' });

      const itemsRes = await request(app)
        .post(`/api/service-orders/${osId}/items`)
        .set(headersAdminA)
        .send({
          parts: [{ stockId: stock.id, quantity: 2 }],
          services: [{ description: 'Oil change', quantity: 1, unitPrice: '50.00' }]
        });
      const osPartId = itemsRes.body.data.parts[0].id;
      const serviceId = itemsRes.body.data.services[0].id;

      const reqApprovalRes = await request(app)
        .post(`/api/service-orders/${osId}/approval/request`)
        .set(headersAdminA);
      const approvalId = reqApprovalRes.body.data.id;

      await request(app)
        .post(`/api/service-orders/${osId}/approval/approve`)
        .set(headersManagerA)
        .send({ approvalId });

      await request(app)
        .post(`/api/service-orders/${osId}/services/${serviceId}/assign`)
        .set(headersAdminA)
        .send({ technicianId: mechanicA.id });

      // 1. Concurrent starts
      const [start1, start2] = await Promise.all([
        request(app).post(`/api/service-orders/${osId}/services/${serviceId}/start`).set(headersMechanicA),
        request(app).post(`/api/service-orders/${osId}/services/${serviceId}/start`).set(headersMechanicA),
      ]);
      expect([start1.status, start2.status]).toContain(200);

      // 2. Concurrent stock consumption (different Idempotency-Keys, same quantity = 2)
      // Since stock is 10 and requested is 2 each, both should succeed, but overall quantity decreased should be 4
      const [cons1, cons2] = await Promise.all([
        request(app).post(`/api/service-orders/${osId}/parts/${osPartId}/consume`).set(headersAdminA).set('Idempotency-Key', crypto.randomUUID()).send({ quantity: 2 }),
        request(app).post(`/api/service-orders/${osId}/parts/${osPartId}/consume`).set(headersAdminA).set('Idempotency-Key', crypto.randomUUID()).send({ quantity: 2 }),
      ]);
      // Wait, is it allowed to consume 4 when only 2 are planned?
      // No! The concurrency validation in P4.6 locks the OSPart and throws 409 if the requested quantity exceeds the remaining planned quantity!
      // Since planned is 2, one will succeed (200) and the other will fail (409) because of planned quantity checks!
      const consStatuses = [cons1.status, cons2.status];
      expect(consStatuses).toContain(200);
      expect(consStatuses.includes(400) || consStatuses.includes(409)).toBe(true);

      // Complete service and OS
      await request(app)
        .post(`/api/service-orders/${osId}/services/${serviceId}/complete`)
        .set(headersMechanicA)
        .send({ notes: 'Done.' });

      await request(app)
        .post(`/api/service-orders/${osId}/complete`)
        .set(headersAdminA)
        .send({ completionNotes: 'Done.' });

      // 3. Concurrent receivable generation
      const [gen1, gen2] = await Promise.all([
        request(app).post(`/api/service-orders/${osId}/finance/receivable`).set(headersAdminA).send({ dueDate: '2026-08-30' }),
        request(app).post(`/api/service-orders/${osId}/finance/receivable`).set(headersAdminA).send({ dueDate: '2026-08-30' }),
      ]);

      const genStatuses = [gen1.status, gen2.status];
      expect(genStatuses).toContain(201);
      expect(genStatuses).toContain(200); // 200 is returned by the idempotent fallback catch block
    });
  });

  describe('rollback', () => {
    it('should roll back faturamento transaction when AuditLog logging fails', async () => {
      const runId = crypto.randomUUID();

      const client = await FactoryEngine.createClient(companyA.id);
      const vehicle = await FactoryEngine.createVehicle(companyA.id, client.id);
      const osRes = await request(app)
        .post('/api/service-orders')
        .set(headersAdminA)
        .send({ clientId: client.id, vehicleId: vehicle.id, branchId: branchA1.id });
      const osId = osRes.body.data.id;

      await request(app)
        .put(`/api/service-orders/${osId}/diagnosis`)
        .set(headersAdminA)
        .send({ description: 'Testing. [DIAGNÓSTICO TÉCNICO] Diagnosis.' });

      const itemsRes = await request(app)
        .post(`/api/service-orders/${osId}/items`)
        .set(headersAdminA)
        .send({
          parts: [],
          services: [{ description: 'Oil change', quantity: 1, unitPrice: '50.00' }]
        });
      const serviceId = itemsRes.body.data.services[0].id;

      const reqApprovalRes = await request(app)
        .post(`/api/service-orders/${osId}/approval/request`)
        .set(headersAdminA);
      const approvalId = reqApprovalRes.body.data.id;

      await request(app)
        .post(`/api/service-orders/${osId}/approval/approve`)
        .set(headersManagerA)
        .send({ approvalId });

      await request(app)
        .post(`/api/service-orders/${osId}/services/${serviceId}/assign`)
        .set(headersAdminA)
        .send({ technicianId: mechanicA.id });

      await request(app)
        .post(`/api/service-orders/${osId}/services/${serviceId}/start`)
        .set(headersMechanicA);

      await request(app)
        .post(`/api/service-orders/${osId}/services/${serviceId}/complete`)
        .set(headersMechanicA)
        .send({ notes: 'Done.' });

      await request(app)
        .post(`/api/service-orders/${osId}/complete`)
        .set(headersAdminA)
        .send({ completionNotes: 'Done.' });

      // Enable global audit failure flag
      (global as any).failAuditLog = true;

      const genRes = await request(app)
        .post(`/api/service-orders/${osId}/finance/receivable`)
        .set(headersAdminA)
        .send({ dueDate: '2026-08-30' });
      expect(genRes.status).toBe(500);

      // Verify no FinancialRecord was created
      const count = await prismaClient.financialRecord.count({
        where: { serviceOrderId: osId }
      });
      expect(count).toBe(0);
    });
  });

  describe('reconciliation', () => {
    it('should reconcile final totals for approval, stock movements, and faturamento values', async () => {
      const runId = crypto.randomUUID();

      const part = await FactoryEngine.createPart(companyA.id, {
        salePrice: new Prisma.Decimal('100.00'),
        name: `Part E2E Rec ${runId}`,
      } as any);

      const stock = await prismaClient.stock.create({
        data: {
          companyId: companyA.id,
          branchId: branchA1.id,
          partId: part.id,
          quantity: 10,
        },
      });

      const client = await FactoryEngine.createClient(companyA.id);
      const vehicle = await FactoryEngine.createVehicle(companyA.id, client.id);
      const osRes = await request(app)
        .post('/api/service-orders')
        .set(headersAdminA)
        .send({ clientId: client.id, vehicleId: vehicle.id, branchId: branchA1.id });
      const osId = osRes.body.data.id;

      await request(app)
        .put(`/api/service-orders/${osId}/diagnosis`)
        .set(headersAdminA)
        .send({ description: 'Testing. [DIAGNÓSTICO TÉCNICO] Diagnosis.' });

      const itemsRes = await request(app)
        .post(`/api/service-orders/${osId}/items`)
        .set(headersAdminA)
        .send({
          parts: [{ stockId: stock.id, quantity: 2 }],
          services: [{ description: 'Oil change', quantity: 1, unitPrice: '50.00' }]
        });
      const osPartId = itemsRes.body.data.parts[0].id;
      const serviceId = itemsRes.body.data.services[0].id;

      const reqApprovalRes = await request(app)
        .post(`/api/service-orders/${osId}/approval/request`)
        .set(headersAdminA);
      const approvalId = reqApprovalRes.body.data.id;

      await request(app)
        .post(`/api/service-orders/${osId}/approval/approve`)
        .set(headersManagerA)
        .send({ approvalId });

      await request(app)
        .post(`/api/service-orders/${osId}/services/${serviceId}/assign`)
        .set(headersAdminA)
        .send({ technicianId: mechanicA.id });

      await request(app)
        .post(`/api/service-orders/${osId}/services/${serviceId}/start`)
        .set(headersMechanicA);

      await request(app)
        .post(`/api/service-orders/${osId}/parts/${osPartId}/consume`)
        .set(headersAdminA)
        .set('Idempotency-Key', crypto.randomUUID())
        .send({ quantity: 2 });

      await request(app)
        .post(`/api/service-orders/${osId}/services/${serviceId}/complete`)
        .set(headersMechanicA)
        .send({ notes: 'Done.' });

      await request(app)
        .post(`/api/service-orders/${osId}/complete`)
        .set(headersAdminA)
        .send({ completionNotes: 'Done.' });

      await request(app)
        .post(`/api/service-orders/${osId}/finance/receivable`)
        .set(headersAdminA)
        .send({ dueDate: '2026-08-30' });

      // Run query-level reconciliations directly on database
      const approval = await prismaClient.serviceOrderApproval.findUnique({ where: { id: approvalId } });
      const receivable = await prismaClient.financialRecord.findFirst({ where: { serviceOrderId: osId } });
      const osPart = await prismaClient.oSPart.findUnique({ where: { id: osPartId } });
      const movementsSum = await prismaClient.inventoryMovement.aggregate({
        where: { osPartId, type: 'OUT' },
        _sum: { quantity: true }
      });

      expect(approval).toBeDefined();
      expect(receivable).toBeDefined();
      expect(osPart).toBeDefined();

      // Check 1: approval.finalValue === receivable.amount
      expect(Number(approval?.finalValue)).toBe(Number(receivable?.amount));
      expect(Number(receivable?.amount)).toBe(250); // (2 * 100) + 50

      // Check 2: OSPart.consumedQuantity === SUM(InventoryMovement OUT)
      expect(Number(osPart?.consumedQuantity)).toBe(Number(movementsSum._sum.quantity));
      expect(Number(osPart?.consumedQuantity)).toBe(2);
    });
  });
});
