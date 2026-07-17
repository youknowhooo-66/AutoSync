import request from 'supertest';
import app from '../../src/app';
import { FactoryEngine } from '../factories/FactoryEngine';
import { generateAuthHeaders } from '../helpers/auth';
import { prismaClient } from '../../src/shared/database/prismaClient';
import { Prisma } from '@prisma/client';
import { vi } from 'vitest';
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

const { randomUUID } = require('crypto');

describe('Service Order Financial Integration (P4.8)', () => {
  let company: any;
  let branch: any;
  let branch2: any;
  let admin: any;
  let manager: any;
  let attendant: any;
  let mechanic1: any;
  let financialUser: any;
  let client: any;
  let vehicle: any;
  let part: any;
  let stockEntry: any;

  let headersAdmin: any;
  let headersManager: any;
  let headersAttendant: any;
  let headersMechanic1: any;
  let headersFinancial: any;

  beforeEach(async () => {
    company = await FactoryEngine.createCompany();
    branch = await FactoryEngine.createBranch(company.id);
    branch2 = await FactoryEngine.createBranch(company.id);

    admin = await FactoryEngine.createUser(company.id, { role: 'ADMIN', branchId: branch.id });
    manager = await FactoryEngine.createUser(company.id, { role: 'MANAGER', branchId: branch.id });
    attendant = await FactoryEngine.createUser(company.id, { role: 'ATTENDANT', branchId: branch.id });
    mechanic1 = await FactoryEngine.createUser(company.id, { role: 'MECHANIC', branchId: branch.id });
    financialUser = await FactoryEngine.createUser(company.id, { role: 'FINANCIAL', branchId: branch.id });

    client = await FactoryEngine.createClient(company.id);
    vehicle = await FactoryEngine.createVehicle(company.id, client.id);

    part = await FactoryEngine.createPart(company.id, {
      salePrice: new Prisma.Decimal('100.00'),
      name: 'Pastilha Silenciosa',
    } as any);

    stockEntry = await prismaClient.stock.create({
      data: {
        companyId: company.id,
        branchId: branch.id,
        partId: part.id,
        quantity: 10,
      },
    });

    headersAdmin = generateAuthHeaders(admin);
    headersManager = generateAuthHeaders(manager);
    headersAttendant = generateAuthHeaders(attendant);
    headersMechanic1 = generateAuthHeaders(mechanic1);
    headersFinancial = generateAuthHeaders(financialUser);
    (global as any).failAuditLog = false;
  });

  async function createFinishedOS(opts: {
    finalValue?: string;
    invalidateLatestApproval?: boolean;
    pendingLatestApproval?: boolean;
  } = {}) {
    const { finalValue = '220.00', invalidateLatestApproval = false, pendingLatestApproval = false } = opts;

    // 1. Create OS
    const osRes = await request(app)
      .post('/api/service-orders')
      .set(headersAdmin)
      .send({ clientId: client.id, vehicleId: vehicle.id, branchId: branch.id });
    const os = osRes.body.data;

    // 2. Add part and service
    const itemRes = await request(app)
      .post(`/api/service-orders/${os.id}/items`)
      .set(headersAdmin)
      .send({
        parts: [{ stockId: stockEntry.id, quantity: 1 }],
        services: [{ description: 'Troca de pastilha', quantity: 1, unitPrice: '120.00' }],
      });
    const osPartId = itemRes.body.data.parts[0].id;
    const serviceId = itemRes.body.data.services[0].id;

    // 3. Diagnosis
    await request(app)
      .put(`/api/service-orders/${os.id}/diagnosis`)
      .set(headersAdmin)
      .send({ description: 'Pastilhas de freio gastas. [DIAGNÓSTICO TÉCNICO] Laudo ok.' });

    // 4. Request + approve budget
    const approvalReq = await request(app)
      .post(`/api/service-orders/${os.id}/approval/request`)
      .set(headersAdmin);
    const approvalId = approvalReq.body.data.id;

    await request(app)
      .post(`/api/service-orders/${os.id}/approval/approve`)
      .set(headersManager)
      .send({ approvalId });

    // Force finalValue if needed
    if (finalValue !== '220.00') {
      await prismaClient.serviceOrderApproval.update({
        where: { id: approvalId },
        data: { finalValue: new Prisma.Decimal(finalValue) },
      });
    }

    // 5. Assign and execute
    await request(app)
      .post(`/api/service-orders/${os.id}/services/${serviceId}/assign`)
      .set(headersAdmin)
      .send({ technicianId: mechanic1.id });

    await request(app)
      .post(`/api/service-orders/${os.id}/services/${serviceId}/start`)
      .set(headersMechanic1);

    await request(app)
      .post(`/api/service-orders/${os.id}/parts/${osPartId}/consume`)
      .set(headersAdmin)
      .set('Idempotency-Key', randomUUID())
      .send({ quantity: 1 });

    await request(app)
      .post(`/api/service-orders/${os.id}/services/${serviceId}/complete`)
      .set(headersMechanic1)
      .send({ notes: 'Peças trocadas com sucesso.' });

    // Invalidate latest approval before complete if requested
    if (invalidateLatestApproval) {
      await request(app)
        .post(`/api/service-orders/${os.id}/approval/invalidate`)
        .set(headersManager)
        .send({ approvalId, reason: 'Scope change' });
    }

    // Pend latest approval before complete if requested
    if (pendingLatestApproval) {
      // Set the approval to PENDING
      await prismaClient.serviceOrderApproval.update({
        where: { id: approvalId },
        data: { status: 'PENDING' },
      });
    }

    // 6. Complete OS
    const completeRes = await request(app)
      .post(`/api/service-orders/${os.id}/complete`)
      .set(headersAdmin)
      .send({ completionNotes: 'Encerrando OS de freio.' });

    const finishedOS = await prismaClient.serviceOrder.findUnique({
      where: { id: os.id },
    });

    return { os: finishedOS || os, approvalId };
  }

  describe('GET /api/service-orders/:serviceOrderId/finance', () => {
    it('should return NOT_ELIGIBLE and SERVICE_ORDER_NOT_FINISHED if OS is not finished', async () => {
      const osRes = await request(app)
        .post('/api/service-orders')
        .set(headersAdmin)
        .send({ clientId: client.id, vehicleId: vehicle.id, branchId: branch.id });
      const os = osRes.body.data;

      const res = await request(app)
        .get(`/api/service-orders/${os.id}/finance`)
        .set(headersAdmin);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('NOT_ELIGIBLE');
      expect(res.body.data.reason).toBe('SERVICE_ORDER_NOT_FINISHED');
    });

    it('should return NOT_REQUIRED and ZERO_VALUE if finalValue is zero', async () => {
      const { os } = await createFinishedOS({ finalValue: '0.00' });

      const res = await request(app)
        .get(`/api/service-orders/${os.id}/finance`)
        .set(headersAdmin);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('NOT_REQUIRED');
      expect(res.body.data.reason).toBe('ZERO_VALUE');
      expect(res.body.data.finalValue).toBe('0');
    });

    it('should return NOT_GENERATED when OS is finished but receivable is not generated', async () => {
      const { os } = await createFinishedOS();

      const res = await request(app)
        .get(`/api/service-orders/${os.id}/finance`)
        .set(headersAdmin);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('NOT_GENERATED');
      expect(res.body.data.finalValue).toBe('220');
    });

    it('should return GENERATED with receivable details once generated', async () => {
      const { os } = await createFinishedOS();

      await request(app)
        .post(`/api/service-orders/${os.id}/finance/receivable`)
        .set(headersAdmin)
        .send({ dueDate: '2026-12-31' });

      const res = await request(app)
        .get(`/api/service-orders/${os.id}/finance`)
        .set(headersAdmin);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('GENERATED');
      expect(res.body.data.receivable).toBeDefined();
      expect(res.body.data.receivable.amount).toBe('220');
      expect(res.body.data.receivable.status).toBe('PENDING');
    });

    it('should block tenant cross-access (404)', async () => {
      const { os } = await createFinishedOS();

      const companyOther = await FactoryEngine.createCompany();
      const adminOther = await FactoryEngine.createUser(companyOther.id, { role: 'ADMIN' });
      const headersOther = generateAuthHeaders(adminOther);

      const res = await request(app)
        .get(`/api/service-orders/${os.id}/finance`)
        .set(headersOther);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/service-orders/:serviceOrderId/finance/receivable', () => {
    it('should generate financial receivable successfully', async () => {
      const { os, approvalId } = await createFinishedOS();

      const res = await request(app)
        .post(`/api/service-orders/${os.id}/finance/receivable`)
        .set(headersAdmin)
        .send({ dueDate: '2026-08-30' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Recebível gerado com sucesso.');
      expect(res.body.data.amount).toBe('220');
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.dueDate).toContain('2026-08-30T12:00:00.000Z');

      // Verify DB mapping
      const record = await prismaClient.financialRecord.findUnique({
        where: { id: res.body.data.id },
      });
      expect(record).toBeDefined();
      expect(record?.type).toBe('RECEIVABLE');
      expect(record?.serviceOrderId).toBe(os.id);
      expect(record?.serviceOrderApprovalId).toBe(approvalId);
      expect(Number(record?.amount)).toBe(220);

      // Verify Audit Log
      const log = await prismaClient.auditLog.findFirst({
        where: { action: 'CREATE_FROM_SERVICE_ORDER', resourceId: record?.id },
      });
      expect(log).toBeDefined();
    });

    it('should block generating for non-finished OS', async () => {
      const osRes = await request(app)
        .post('/api/service-orders')
        .set(headersAdmin)
        .send({ clientId: client.id, vehicleId: vehicle.id, branchId: branch.id });
      const os = osRes.body.data;

      const res = await request(app)
        .post(`/api/service-orders/${os.id}/finance/receivable`)
        .set(headersAdmin)
        .send({ dueDate: '2026-08-30' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('A Ordem de Serviço deve estar concluída');
    });

    it('should block if latest approval is not APPROVED', async () => {
      const { os, approvalId } = await createFinishedOS();

      // Manually set latest approval status to PENDING in the DB *after* completion
      await prismaClient.serviceOrderApproval.update({
        where: { id: approvalId },
        data: { status: 'PENDING' },
      });

      const res = await request(app)
        .post(`/api/service-orders/${os.id}/finance/receivable`)
        .set(headersAdmin)
        .send({ dueDate: '2026-08-30' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('O último orçamento deve estar aprovado');
    });

    it('should return 409 Conflict if finalValue is zero (NOT_REQUIRED)', async () => {
      const { os } = await createFinishedOS({ finalValue: '0.00' });

      const res = await request(app)
        .post(`/api/service-orders/${os.id}/finance/receivable`)
        .set(headersAdmin)
        .send({ dueDate: '2026-08-30' });

      expect(res.status).toBe(409);
      expect(res.body.details[0].code).toBe('FINANCIAL_OBLIGATION_NOT_REQUIRED');
    });

    it('should block invalid or retroactive due dates', async () => {
      const { os } = await createFinishedOS();

      // Retroactive
      const retroRes = await request(app)
        .post(`/api/service-orders/${os.id}/finance/receivable`)
        .set(headersAdmin)
        .send({ dueDate: '2020-01-01' });

      expect(retroRes.status).toBe(400);
      expect(retroRes.body.message).toContain('A data de vencimento não pode ser anterior');

      // Invalid calendar date
      const invalidRes = await request(app)
        .post(`/api/service-orders/${os.id}/finance/receivable`)
        .set(headersAdmin)
        .send({ dueDate: '2026-02-30' }); // February 30th

      expect(invalidRes.status).toBe(400);
      expect(invalidRes.body.message).toContain('Data de vencimento inválida');
    });

    it('should block strictly structured request body with forged values', async () => {
      const { os } = await createFinishedOS();

      const res = await request(app)
        .post(`/api/service-orders/${os.id}/finance/receivable`)
        .set(headersAdmin)
        .send({
          dueDate: '2026-08-30',
          amount: '10.00', // forged
          companyId: 'forged-company',
        });

      expect(res.status).toBe(400); // strict validation error
    });

    it('should enforce idempotency for sequential requests', async () => {
      const { os } = await createFinishedOS();

      // First call
      const res1 = await request(app)
        .post(`/api/service-orders/${os.id}/finance/receivable`)
        .set(headersAdmin)
        .send({ dueDate: '2026-08-30' });
      expect(res1.status).toBe(201);

      // Second call (sequential)
      const res2 = await request(app)
        .post(`/api/service-orders/${os.id}/finance/receivable`)
        .set(headersAdmin)
        .send({ dueDate: '2026-08-30' });

      expect(res2.status).toBe(200);
      expect(res2.body.message).toBe('Recebível já existente (idempotente).');
      expect(res2.body.data.id).toBe(res1.body.data.id);
    });

    it('should enforce idempotency under concurrent requests', async () => {
      const { os } = await createFinishedOS();

      // Fire concurrent requests
      const [r1, r2] = await Promise.all([
        request(app)
          .post(`/api/service-orders/${os.id}/finance/receivable`)
          .set(headersAdmin)
          .send({ dueDate: '2026-08-30' }),
        request(app)
          .post(`/api/service-orders/${os.id}/finance/receivable`)
          .set(headersAdmin)
          .send({ dueDate: '2026-08-30' }),
      ]);

      const statuses = [r1.status, r2.status];
      expect(statuses).toContain(201);
      expect(statuses).toContain(200);

      const count = await prismaClient.financialRecord.count({
        where: { serviceOrderId: os.id },
      });
      expect(count).toBe(1);
    });

    it('should roll back if AuditLogService fails inside transaction', async () => {
      const { os } = await createFinishedOS();

      // Set global flag to throw error during audit logging
      (global as any).failAuditLog = true;

      const res = await request(app)
        .post(`/api/service-orders/${os.id}/finance/receivable`)
        .set(headersAdmin)
        .send({ dueDate: '2026-08-30' });

      expect(res.status).toBe(500);

      // Verify no FinancialRecord was created due to transaction rollback
      const count = await prismaClient.financialRecord.count({
        where: { serviceOrderId: os.id },
      });
      expect(count).toBe(0);
    });

    it('should enforce RBAC authorization mapping', async () => {
      const { os } = await createFinishedOS();

      // ATTENDANT can view but cannot generate
      const resViewAttendant = await request(app)
        .get(`/api/service-orders/${os.id}/finance`)
        .set(headersAttendant);
      expect(resViewAttendant.status).toBe(200);

      const resGenAttendant = await request(app)
        .post(`/api/service-orders/${os.id}/finance/receivable`)
        .set(headersAttendant)
        .send({ dueDate: '2026-08-30' });
      expect(resGenAttendant.status).toBe(403);

      // FINANCIAL can view and generate
      const resGenFinancial = await request(app)
        .post(`/api/service-orders/${os.id}/finance/receivable`)
        .set(headersFinancial)
        .send({ dueDate: '2026-08-30' });
      expect(resGenFinancial.status).toBe(201);
    });
  });
});
