import request from 'supertest';
import app from '../../src/app';
import { FactoryEngine } from '../factories/FactoryEngine';
import { generateAuthHeaders } from '../helpers/auth';
import { prismaClient } from '../../src/shared/database/prismaClient';
import { Prisma } from '@prisma/client';

const { randomUUID } = require('crypto');

describe('Service Order Completion (P4.7)', () => {
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
  let stockEntry: any;

  let headersAdmin: any;
  let headersManager: any;
  let headersMechanic1: any;
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

    part = await FactoryEngine.createPart(company.id, {
      salePrice: new Prisma.Decimal('50.00'),
      name: 'Pastilha de Freio',
    } as any);

    stockEntry = await prismaClient.stock.create({
      data: {
        companyId: company.id,
        branchId: branch.id,
        partId: part.id,
        quantity: 20,
      },
    });

    headersAdmin = generateAuthHeaders(admin);
    headersManager = generateAuthHeaders(manager);
    headersMechanic1 = generateAuthHeaders(mechanic1);
    headersAttendant = generateAuthHeaders(attendant);
  });

  /**
   * Helper: creates an OS fully ready for completion:
   * part added, service added, approved, technician assigned,
   * service started + completed, and part consumed.
   */
  async function createReadyOS(opts: {
    withDiagnosis?: boolean;
    partQuantity?: number;
    consumePart?: boolean;
  } = {}) {
    const { withDiagnosis = true, partQuantity = 2, consumePart = true } = opts;

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
        parts: [{ stockId: stockEntry.id, quantity: partQuantity }],
        services: [{ description: 'Troca de pastilha', quantity: 1, unitPrice: '120.00' }],
      });
    const osPartId = itemRes.body.data.parts[0].id;
    const serviceId = itemRes.body.data.services[0].id;

    // 3. Diagnosis (optional)
    if (withDiagnosis) {
      await request(app)
        .put(`/api/service-orders/${os.id}/diagnosis`)
        .set(headersAdmin)
        .send({ description: 'Pastilhas dianteiras desgastadas além do limite de segurança.' });
    }

    // 4. Request + approve budget
    const approvalReq = await request(app)
      .post(`/api/service-orders/${os.id}/approval/request`)
      .set(headersAdmin);
    const approvalId = approvalReq.body.data.id;

    await request(app)
      .post(`/api/service-orders/${os.id}/approval/approve`)
      .set(headersManager)
      .send({ approvalId });

    // 5. Assign technician + start service
    await request(app)
      .post(`/api/service-orders/${os.id}/services/${serviceId}/assign`)
      .set(headersAdmin)
      .send({ technicianId: mechanic1.id });

    await request(app)
      .post(`/api/service-orders/${os.id}/services/${serviceId}/start`)
      .set(headersMechanic1);

    // 6. Consume part stock (while service is IN_PROGRESS)
    if (consumePart) {
      await request(app)
        .post(`/api/service-orders/${os.id}/parts/${osPartId}/consume`)
        .set(headersAdmin)
        .set('Idempotency-Key', randomUUID())
        .send({ quantity: partQuantity });
    }

    // 7. Complete service execution
    await request(app)
      .post(`/api/service-orders/${os.id}/services/${serviceId}/complete`)
      .set(headersMechanic1)
      .send({ notes: 'Peças trocadas com sucesso.' });

    return { os, osPartId, serviceId, approvalId };
  }

  // ─── Readiness endpoint ────────────────────────────────────────────────────

  describe('GET /completion/readiness', () => {
    it('should return ready=true when all gates pass', async () => {
      const { os } = await createReadyOS();

      const res = await request(app)
        .get(`/api/service-orders/${os.id}/completion/readiness`)
        .set(headersAdmin);

      console.log('READINESS RES BODY:', JSON.stringify(res.body, null, 2));

      expect(res.status).toBe(200);
      expect(res.body.data.ready).toBe(true);
      expect(res.body.data.blockers).toHaveLength(0);
    });

    it('should return ready=false and DIAGNOSIS_MISSING when no diagnosis', async () => {
      // Create a ready OS first (with diagnosis to get IN_PROGRESS)
      const { os } = await createReadyOS({ withDiagnosis: true });

      // Then clear the diagnosis marker directly in DB to simulate missing diagnosis
      await prismaClient.serviceOrder.update({
        where: { id: os.id },
        data: { notes: null },
      });

      const res = await request(app)
        .get(`/api/service-orders/${os.id}/completion/readiness`)
        .set(headersAdmin);

      expect(res.status).toBe(200);
      expect(res.body.data.ready).toBe(false);
      const codes = res.body.data.blockers.map((b: any) => b.code);
      expect(codes).toContain('DIAGNOSIS_MISSING');
    });

    it('should return PART_NOT_FULLY_CONSUMED when part not consumed', async () => {
      const { os } = await createReadyOS({ consumePart: false });

      const res = await request(app)
        .get(`/api/service-orders/${os.id}/completion/readiness`)
        .set(headersAdmin);

      expect(res.status).toBe(200);
      expect(res.body.data.ready).toBe(false);
      const codes = res.body.data.blockers.map((b: any) => b.code);
      expect(codes).toContain('PART_NOT_FULLY_CONSUMED');
    });

    it('should return APPROVAL_NOT_APPROVED for latest approval INVALIDATED with old APPROVED version', async () => {
      const { os, approvalId } = await createReadyOS();

      // Invalidate current approval
      await request(app)
        .post(`/api/service-orders/${os.id}/approval/invalidate`)
        .set(headersManager)
        .send({ approvalId, reason: 'Mudança de escopo' });

      const res = await request(app)
        .get(`/api/service-orders/${os.id}/completion/readiness`)
        .set(headersAdmin);

      expect(res.status).toBe(200);
      expect(res.body.data.ready).toBe(false);
      const codes = res.body.data.blockers.map((b: any) => b.code);
      expect(codes).toContain('APPROVAL_NOT_APPROVED');
    });

    it('should return APPROVAL_NOT_APPROVED for latest approval PENDING', async () => {
      // Create OS and add diagnosis first to reach IN_PROGRESS, then request approval without approving
      const osRes = await request(app)
        .post('/api/service-orders')
        .set(headersAdmin)
        .send({ clientId: client.id, vehicleId: vehicle.id, branchId: branch.id });
      const os = osRes.body.data;

      await request(app)
        .post(`/api/service-orders/${os.id}/items`)
        .set(headersAdmin)
        .send({
          parts: [{ stockId: stockEntry.id, quantity: 1 }],
          services: [{ description: 'Diagnóstico', quantity: 1, unitPrice: '50.00' }],
        });

      // Diagnosis transitions OPEN → IN_PROGRESS
      await request(app)
        .put(`/api/service-orders/${os.id}/diagnosis`)
        .set(headersAdmin)
        .send({ description: 'Sistema de freios com desgaste prematuro.' });

      await request(app)
        .post(`/api/service-orders/${os.id}/approval/request`)
        .set(headersAdmin);
      // Don't approve — leave PENDING

      const res = await request(app)
        .get(`/api/service-orders/${os.id}/completion/readiness`)
        .set(headersAdmin);

      expect(res.status).toBe(200);
      expect(res.body.data.ready).toBe(false);
      const codes = res.body.data.blockers.map((b: any) => b.code);
      expect(codes).toContain('APPROVAL_NOT_APPROVED');
    });

    it('should return SERVICE_NOT_COMPLETED when service is not COMPLETED', async () => {
      // Create OS but don't complete the service
      const osRes = await request(app)
        .post('/api/service-orders')
        .set(headersAdmin)
        .send({ clientId: client.id, vehicleId: vehicle.id, branchId: branch.id });
      const os = osRes.body.data;

      const itemRes = await request(app)
        .post(`/api/service-orders/${os.id}/items`)
        .set(headersAdmin)
        .send({
          parts: [{ stockId: stockEntry.id, quantity: 1 }],
          services: [{ description: 'Alinhamento', quantity: 1, unitPrice: '80.00' }],
        });
      const serviceId = itemRes.body.data.services[0].id;
      const osPartId = itemRes.body.data.parts[0].id;

      await request(app)
        .put(`/api/service-orders/${os.id}/diagnosis`)
        .set(headersAdmin)
        .send({ description: 'Eixo dianteiro desalinhado.' });

      const approvalReq = await request(app)
        .post(`/api/service-orders/${os.id}/approval/request`)
        .set(headersAdmin);
      await request(app)
        .post(`/api/service-orders/${os.id}/approval/approve`)
        .set(headersManager)
        .send({ approvalId: approvalReq.body.data.id });

      await request(app)
        .post(`/api/service-orders/${os.id}/services/${serviceId}/assign`)
        .set(headersAdmin)
        .send({ technicianId: mechanic1.id });

      await request(app)
        .post(`/api/service-orders/${os.id}/services/${serviceId}/start`)
        .set(headersMechanic1);
      // Don't complete the service — leave IN_PROGRESS

      await request(app)
        .post(`/api/service-orders/${os.id}/parts/${osPartId}/consume`)
        .set(headersAdmin)
        .set('Idempotency-Key', randomUUID())
        .send({ quantity: 1 });

      const res = await request(app)
        .get(`/api/service-orders/${os.id}/completion/readiness`)
        .set(headersAdmin);

      expect(res.status).toBe(200);
      expect(res.body.data.ready).toBe(false);
      const codes = res.body.data.blockers.map((b: any) => b.code);
      expect(codes).toContain('SERVICE_NOT_COMPLETED');
    });

    it('should return 404 for non-existent OS', async () => {
      const res = await request(app)
        .get(`/api/service-orders/${randomUUID()}/completion/readiness`)
        .set(headersAdmin);

      expect(res.status).toBe(404);
    });
  });

  // ─── Complete endpoint ─────────────────────────────────────────────────────

  describe('POST /complete', () => {
    it('should complete OS successfully when all gates pass', async () => {
      const { os } = await createReadyOS();

      const res = await request(app)
        .post(`/api/service-orders/${os.id}/complete`)
        .set(headersAdmin)
        .send({ completionNotes: 'OS concluída com êxito. Pastilhas substituídas.' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('FINISHED');
      expect(res.body.data.finishedAt).toBeTruthy();
      expect(res.body.data.completionNotes).toBe('OS concluída com êxito. Pastilhas substituídas.');
    });

    it('should return 409 when diagnosis is missing', async () => {
      const { os } = await createReadyOS({ withDiagnosis: false });

      const res = await request(app)
        .post(`/api/service-orders/${os.id}/complete`)
        .set(headersAdmin)
        .send({ completionNotes: 'Concluído.' });

      expect(res.status).toBe(409);
      expect(res.body.details).toBeDefined();
    });

    it('should return 409 when part was not fully consumed', async () => {
      const { os } = await createReadyOS({ consumePart: false });

      const res = await request(app)
        .post(`/api/service-orders/${os.id}/complete`)
        .set(headersAdmin)
        .send({ completionNotes: 'Tentativa de conclusão sem consumo.' });

      expect(res.status).toBe(409);
    });

    it('should return 400 when completionNotes is too short', async () => {
      const { os } = await createReadyOS();

      const res = await request(app)
        .post(`/api/service-orders/${os.id}/complete`)
        .set(headersAdmin)
        .send({ completionNotes: 'OK' });

      expect(res.status).toBe(400);
    });

    it('should return 400 when completionNotes is missing', async () => {
      const { os } = await createReadyOS();

      const res = await request(app)
        .post(`/api/service-orders/${os.id}/complete`)
        .set(headersAdmin)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should prevent double completion (concurrent scenario)', async () => {
      const { os } = await createReadyOS();

      const [res1, res2] = await Promise.all([
        request(app)
          .post(`/api/service-orders/${os.id}/complete`)
          .set(headersAdmin)
          .send({ completionNotes: 'Primeira conclusão concorrente.' }),
        request(app)
          .post(`/api/service-orders/${os.id}/complete`)
          .set(headersAdmin)
          .send({ completionNotes: 'Segunda conclusão concorrente.' }),
      ]);

      const statuses = [res1.status, res2.status].sort();
      expect(statuses).toContain(200);
      expect(statuses).toContain(409);
    });

    it('should not allow re-completion of an already FINISHED OS', async () => {
      const { os } = await createReadyOS();

      await request(app)
        .post(`/api/service-orders/${os.id}/complete`)
        .set(headersAdmin)
        .send({ completionNotes: 'Primeira conclusão.' });

      const res2 = await request(app)
        .post(`/api/service-orders/${os.id}/complete`)
        .set(headersAdmin)
        .send({ completionNotes: 'Segunda tentativa.' });

      expect(res2.status).toBe(409);
    });

    it('should block MECHANIC from completing OS', async () => {
      const { os } = await createReadyOS();

      const res = await request(app)
        .post(`/api/service-orders/${os.id}/complete`)
        .set(headersMechanic1)
        .send({ completionNotes: 'Mecânico tentando concluir a OS.' });

      expect(res.status).toBe(403);
    });

    it('should block ATTENDANT from completing OS', async () => {
      const { os } = await createReadyOS();

      const res = await request(app)
        .post(`/api/service-orders/${os.id}/complete`)
        .set(headersAttendant)
        .send({ completionNotes: 'Atendente tentando concluir a OS.' });

      expect(res.status).toBe(403);
    });

    it('should verify no stock changes after completion', async () => {
      const { os } = await createReadyOS({ partQuantity: 2 });

      // Get stock before completion
      const stockBefore = await prismaClient.stock.findUnique({ where: { id: stockEntry.id } });

      await request(app)
        .post(`/api/service-orders/${os.id}/complete`)
        .set(headersAdmin)
        .send({ completionNotes: 'Conclusão validando integridade do estoque.' });

      // Stock must be unchanged by the completion
      const stockAfter = await prismaClient.stock.findUnique({ where: { id: stockEntry.id } });
      expect(Number(stockAfter?.quantity)).toBe(Number(stockBefore?.quantity));
    });

    it('should verify no new InventoryMovement created during completion', async () => {
      const { os, osPartId } = await createReadyOS({ partQuantity: 2 });

      const movementsBefore = await prismaClient.inventoryMovement.count({
        where: { serviceOrderId: os.id },
      });

      await request(app)
        .post(`/api/service-orders/${os.id}/complete`)
        .set(headersAdmin)
        .send({ completionNotes: 'Conclusão verificando ausência de movimentos extras.' });

      const movementsAfter = await prismaClient.inventoryMovement.count({
        where: { serviceOrderId: os.id },
      });

      expect(movementsAfter).toBe(movementsBefore);
    });

    it('should verify no FinancialRecord created during completion', async () => {
      const { os } = await createReadyOS();

      const financialBefore = await prismaClient.financialRecord.count({
        where: { companyId: company.id },
      });

      await request(app)
        .post(`/api/service-orders/${os.id}/complete`)
        .set(headersAdmin)
        .send({ completionNotes: 'Conclusão sem registro financeiro.' });

      const financialAfter = await prismaClient.financialRecord.count({
        where: { companyId: company.id },
      });

      expect(financialAfter).toBe(financialBefore);
    });

    it('should verify approval snapshot is unchanged after completion', async () => {
      const { os, approvalId } = await createReadyOS();

      await request(app)
        .post(`/api/service-orders/${os.id}/complete`)
        .set(headersAdmin)
        .send({ completionNotes: 'Conclusão verificando snapshot intacto.' });

      const approval = await prismaClient.serviceOrderApproval.findUnique({
        where: { id: approvalId },
      });

      expect(approval?.status).toBe('APPROVED');
      expect(approval?.snapshot).toBeDefined();
    });

    it('should return 409 when last approval is INVALIDATED even if an older was APPROVED', async () => {
      const { os, approvalId } = await createReadyOS();

      await request(app)
        .post(`/api/service-orders/${os.id}/approval/invalidate`)
        .set(headersManager)
        .send({ approvalId, reason: 'Mudança de escopo após conclusão de serviços' });

      const res = await request(app)
        .post(`/api/service-orders/${os.id}/complete`)
        .set(headersAdmin)
        .send({ completionNotes: 'Tentativa com aprovação invalidada.' });

      expect(res.status).toBe(409);
    });

    it('should block further operations after FINISHED', async () => {
      const { os, osPartId, serviceId } = await createReadyOS();

      // Complete OS
      const completeRes = await request(app)
        .post(`/api/service-orders/${os.id}/complete`)
        .set(headersAdmin)
        .send({ completionNotes: 'OS finalizada para teste de bloqueio geral.' });
      expect(completeRes.status).toBe(200);

      // 1. Diagnosis
      const diagRes = await request(app)
        .put(`/api/service-orders/${os.id}/diagnosis`)
        .set(headersAdmin)
        .send({ description: 'Tentativa de novo diagnóstico após conclusão.' });
      expect(diagRes.status).toBe(400);

      // 2. Approval request
      const approvalRes = await request(app)
        .post(`/api/service-orders/${os.id}/approval/request`)
        .set(headersAdmin);
      expect(approvalRes.status).toBe(400);

      // 3. Add Item
      const addItemRes = await request(app)
        .post(`/api/service-orders/${os.id}/items`)
        .set(headersAdmin)
        .send({
          parts: [{ stockId: stockEntry.id, quantity: 1 }],
          services: [],
        });
      expect(addItemRes.status).toBe(400);

      // 4. Remove Item
      const removeItemRes = await request(app)
        .delete(`/api/service-orders/${os.id}/items/${osPartId}`)
        .set(headersAdmin);
      expect(removeItemRes.status).toBe(400);

      // 5. Technical Execution — Assign
      const assignRes = await request(app)
        .post(`/api/service-orders/${os.id}/services/${serviceId}/assign`)
        .set(headersAdmin)
        .send({ technicianId: mechanic1.id });
      expect(assignRes.status).toBe(400);

      // 6. Technical Execution — Start
      const startRes = await request(app)
        .post(`/api/service-orders/${os.id}/services/${serviceId}/start`)
        .set(headersMechanic1);
      expect(startRes.status).toBe(400);

      // 7. Technical Execution — Pause
      const pauseRes = await request(app)
        .post(`/api/service-orders/${os.id}/services/${serviceId}/pause`)
        .set(headersMechanic1);
      expect(pauseRes.status).toBe(400);

      // 8. Technical Execution — Resume
      const resumeRes = await request(app)
        .post(`/api/service-orders/${os.id}/services/${serviceId}/resume`)
        .set(headersMechanic1);
      expect(resumeRes.status).toBe(400);

      // 9. Technical Execution — Complete
      const completeSvcRes = await request(app)
        .post(`/api/service-orders/${os.id}/services/${serviceId}/complete`)
        .set(headersMechanic1)
        .send({ notes: 'Concluir serviço novamente' });
      expect(completeSvcRes.status).toBe(400);

      // 10. Stock consumption
      const consumeRes = await request(app)
        .post(`/api/service-orders/${os.id}/parts/${osPartId}/consume`)
        .set(headersAdmin)
        .set('Idempotency-Key', randomUUID())
        .send({ quantity: 1 });
      expect(consumeRes.status).toBe(400);

      // 11. New OS completion request
      const repeatCompleteRes = await request(app)
        .post(`/api/service-orders/${os.id}/complete`)
        .set(headersAdmin)
        .send({ completionNotes: 'Tentar concluir novamente.' });
      expect(repeatCompleteRes.status).toBe(409);
    });

    it('should record finishedById, finishedAt, and completionNotes', async () => {
      const { os } = await createReadyOS();

      const res = await request(app)
        .post(`/api/service-orders/${os.id}/complete`)
        .set(headersAdmin)
        .send({ completionNotes: 'Conclusão com registro completo de autoria.' });

      expect(res.status).toBe(200);

      const record = await prismaClient.serviceOrder.findUnique({
        where: { id: os.id },
      });

      expect(record?.status).toBe('FINISHED');
      expect(record?.finishedAt).toBeTruthy();
      expect(record?.finishedById).toBe(admin.id);
      expect(record?.completionNotes).toBe('Conclusão com registro completo de autoria.');
    });
  });
});
