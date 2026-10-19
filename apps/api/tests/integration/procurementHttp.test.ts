import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { sign } from 'jsonwebtoken';
import app from '../../src/app';
import authConfig from '../../src/shared/config/auth';
import { prismaClient as prisma } from '../../src/shared/database/prismaClient';

describe('Procurement & Notifications HTTP API Hardening Tests', () => {
  let companyAId: string;
  let branchA1Id: string;
  let branchA2Id: string;
  let companyBId: string;
  let branchB1Id: string;

  let mechanicUser: any;
  let financeUser: any;
  let stockistUser: any;
  let attendantUser: any;
  let companyBUser: any;

  let mechanicToken: string;
  let financeToken: string;
  let stockistToken: string;
  let attendantToken: string;
  let companyBToken: string;

  let serviceOrderId: string;
  let supplierId: string;

  function createToken(user: { id: string; companyId: string; role: string; branchId?: string }) {
    return sign(
      { companyId: user.companyId, role: user.role, branchId: user.branchId },
      authConfig.jwt.secret,
      { subject: user.id, expiresIn: '1h' }
    );
  }

  beforeEach(async () => {
    const compA = await prisma.company.create({
      data: { name: 'Tenant A', document: `DOC-A-${Date.now()}-${Math.random()}` },
    });
    companyAId = compA.id;

    const bA1 = await prisma.branch.create({
      data: { companyId: companyAId, name: 'Branch A1', cnpj: `CNPJ-A1-${Date.now()}` },
    });
    branchA1Id = bA1.id;

    const bA2 = await prisma.branch.create({
      data: { companyId: companyAId, name: 'Branch A2', cnpj: `CNPJ-A2-${Date.now()}` },
    });
    branchA2Id = bA2.id;

    const compB = await prisma.company.create({
      data: { name: 'Tenant B', document: `DOC-B-${Date.now()}-${Math.random()}` },
    });
    companyBId = compB.id;

    const bB1 = await prisma.branch.create({
      data: { companyId: companyBId, name: 'Branch B1', cnpj: `CNPJ-B1-${Date.now()}` },
    });
    branchB1Id = bB1.id;

    mechanicUser = await prisma.user.create({
      data: { companyId: companyAId, branchId: branchA1Id, name: 'Mechanic A', email: `mech-${Date.now()}@test.com`, password: 'hash', role: 'MECHANIC' },
    });
    mechanicToken = createToken(mechanicUser);

    financeUser = await prisma.user.create({
      data: { companyId: companyAId, branchId: branchA1Id, name: 'Finance A', email: `fin-${Date.now()}@test.com`, password: 'hash', role: 'FINANCIAL' },
    });
    financeToken = createToken(financeUser);

    stockistUser = await prisma.user.create({
      data: { companyId: companyAId, branchId: branchA1Id, name: 'Stockist A', email: `stk-${Date.now()}@test.com`, password: 'hash', role: 'STOCKIST' },
    });
    stockistToken = createToken(stockistUser);

    attendantUser = await prisma.user.create({
      data: { companyId: companyAId, branchId: branchA1Id, name: 'Attendant User', email: `attendant-${Date.now()}@test.com`, password: 'hash', role: 'ATTENDANT' },
    });
    attendantToken = createToken(attendantUser);

    companyBUser = await prisma.user.create({
      data: { companyId: companyBId, branchId: branchB1Id, name: 'Company B User', email: `userB-${Date.now()}@test.com`, password: 'hash', role: 'ADMIN' },
    });
    companyBToken = createToken(companyBUser);

    const supplier = await prisma.supplier.create({
      data: { companyId: companyAId, name: 'AutoParts Supplier', cnpj: `CNPJ-SUP-${Date.now()}` },
    });
    supplierId = supplier.id;

    const client = await prisma.client.create({
      data: { companyId: companyAId, name: 'Client A', document: `DOC-${Date.now()}` },
    });

    const vehicle = await prisma.vehicle.create({
      data: { companyId: companyAId, clientId: client.id, plate: `PLT-${Date.now()}`, brand: 'Fiat', model: 'Uno', year: 2018 },
    });

    const os = await prisma.serviceOrder.create({
      data: { companyId: companyAId, branchId: branchA1Id, clientId: client.id, vehicleId: vehicle.id, status: 'OPEN' },
    });
    serviceOrderId = os.id;
  });

  it('should return 401 Unauthenticated when no JWT token is provided', async () => {
    const res = await request(app).get('/api/procurement/part-requests');
    expect(res.status).toBe(401);
  });

  it('should return 403 Forbidden when user lacks specific permission for an action (RBAC)', async () => {
    const pr = await prisma.purchaseRequest.create({
      data: { companyId: companyAId, branchId: branchA1Id, serviceOrderId, createdBy: mechanicUser.id, provisionalName: 'Peça X', quantity: 1, status: 'REQUESTED' },
    });

    const res = await request(app)
      .post(`/api/procurement/part-requests/${pr.id}/start`)
      .set('Authorization', `Bearer ${mechanicToken}`);

    expect(res.status).toBe(403);
    expect(JSON.stringify(res.body)).toMatch(/Forbidden|permission/i);
  });

  it('should return 403 Forbidden when ATTENDANT tries to install a part (REVOKED ROLE PERMISSION)', async () => {
    const pr = await prisma.purchaseRequest.create({
      data: { companyId: companyAId, branchId: branchA1Id, serviceOrderId, createdBy: mechanicUser.id, provisionalName: 'Peça Teste', quantity: 1, status: 'READY_FOR_PICKUP' },
    });

    const res = await request(app)
      .post(`/api/procurement/part-requests/${pr.id}/install`)
      .set('Authorization', `Bearer ${attendantToken}`);

    expect(res.status).toBe(403);
  });

  it('should return 404 when attempting to access a PurchaseRequest belonging to another company (Tenant Scoping)', async () => {
    const pr = await prisma.purchaseRequest.create({
      data: { companyId: companyAId, branchId: branchA1Id, serviceOrderId, createdBy: mechanicUser.id, provisionalName: 'Peça Tenant A', quantity: 1, status: 'REQUESTED' },
    });

    const res = await request(app)
      .get(`/api/procurement/part-requests/${pr.id}`)
      .set('Authorization', `Bearer ${companyBToken}`);

    expect(res.status).toBe(404);
  });

  it('should return 404 when user from Branch A1 tries to access request of Branch A2 (Branch Scoping)', async () => {
    const prBranchA2 = await prisma.purchaseRequest.create({
      data: { companyId: companyAId, branchId: branchA2Id, serviceOrderId, createdBy: mechanicUser.id, provisionalName: 'Peça Branch A2', quantity: 1, status: 'REQUESTED' },
    });

    const res = await request(app)
      .get(`/api/procurement/part-requests/${prBranchA2.id}`)
      .set('Authorization', `Bearer ${mechanicToken}`)
      .set('X-Branch-Id', branchA1Id);

    expect(res.status).toBe(404);
  });

  it('should ignore spoofed actor IDs sent in request body and use authenticated user', async () => {
    const spoofedUserId = 'fake-user-id-999999';

    const res = await request(app)
      .post('/api/procurement/part-requests')
      .set('Authorization', `Bearer ${mechanicToken}`)
      .send({
        serviceOrderId,
        provisionalName: 'Sensor de Fase Engine',
        requestedQuantity: 1,
        requestedById: spoofedUserId,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.createdBy).toBe(mechanicUser.id);
    expect(res.body.data.createdBy).not.toBe(spoofedUserId);
  });

  it('should provide code suggestion via GET /part-requests/:id/code-suggestion', async () => {
    const pr = await prisma.purchaseRequest.create({
      data: { companyId: companyAId, branchId: branchA1Id, serviceOrderId, createdBy: mechanicUser.id, provisionalName: 'Pastilha Dianteira', quantity: 1, status: 'IN_PROGRESS' },
    });

    const res = await request(app)
      .get(`/api/procurement/part-requests/${pr.id}/code-suggestion`)
      .set('Authorization', `Bearer ${financeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.suggestedCode).toMatch(/^PEC-2026-[A-Z0-9]{6}$/);
  });

  it('should reject physical receipt when receivedQuantity is less than requestedQuantity', async () => {
    const pr = await prisma.purchaseRequest.create({
      data: { companyId: companyAId, branchId: branchA1Id, serviceOrderId, createdBy: mechanicUser.id, provisionalName: 'Jogo de Velas (4un)', quantity: 4, requestedQuantity: 4, status: 'IN_PROGRESS' },
    });

    const res = await request(app)
      .post(`/api/procurement/part-requests/${pr.id}/receive`)
      .set('Authorization', `Bearer ${stockistToken}`)
      .send({
        partName: 'Vela NGK',
        receivedQuantity: 2,
        unitPrice: 25.00,
      });

    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toMatch(/inferior à quantidade solicitada/i);
  });

  it('should handle real parallel concurrent HTTP requests for receive safely (DB Idempotency)', async () => {
    const pr = await prisma.purchaseRequest.create({
      data: { companyId: companyAId, branchId: branchA1Id, serviceOrderId, createdBy: mechanicUser.id, provisionalName: 'Filtro Concorrente', quantity: 2, requestedQuantity: 2, status: 'IN_PROGRESS' },
    });

    const payload = {
      partName: 'Filtro Mann Filter',
      receivedQuantity: 2,
      unitPrice: 50.00,
    };

    const results = await Promise.allSettled([
      request(app)
        .post(`/api/procurement/part-requests/${pr.id}/receive`)
        .set('Authorization', `Bearer ${stockistToken}`)
        .send(payload),
      request(app)
        .post(`/api/procurement/part-requests/${pr.id}/receive`)
        .set('Authorization', `Bearer ${stockistToken}`)
        .send(payload),
    ]);

    expect(results.length).toBe(2);

    // Verify DB count guarantees
    expect(
      await prisma.inventoryMovement.count({
        where: { idempotencyKey: `recv-${pr.id}` },
      })
    ).toBe(1);

    expect(
      await prisma.stockReservation.count({
        where: { purchaseRequestId: pr.id },
      })
    ).toBe(1);

    expect(
      await prisma.purchaseRequestEvent.count({
        where: { purchaseRequestId: pr.id, type: 'PART_RECEIVED' },
      })
    ).toBe(1);
  });

  it('should handle real parallel concurrent HTTP requests for install safely (DB Idempotency)', async () => {
    const pr = await prisma.purchaseRequest.create({
      data: { companyId: companyAId, branchId: branchA1Id, serviceOrderId, createdBy: mechanicUser.id, provisionalName: 'Disco Concorrente', quantity: 2, requestedQuantity: 2, status: 'IN_PROGRESS' },
    });

    // Execute receipt first
    await request(app)
      .post(`/api/procurement/part-requests/${pr.id}/receive`)
      .set('Authorization', `Bearer ${stockistToken}`)
      .send({ partName: 'Disco Fremax', receivedQuantity: 2, unitPrice: 120.00 });

    const payload = { installedQuantity: 2 };

    const results = await Promise.allSettled([
      request(app)
        .post(`/api/procurement/part-requests/${pr.id}/install`)
        .set('Authorization', `Bearer ${mechanicToken}`)
        .send(payload),
      request(app)
        .post(`/api/procurement/part-requests/${pr.id}/install`)
        .set('Authorization', `Bearer ${mechanicToken}`)
        .send(payload),
    ]);

    expect(results.length).toBe(2);

    expect(
      await prisma.inventoryMovement.count({
        where: { idempotencyKey: `inst-${pr.id}` },
      })
    ).toBe(1);

    expect(
      await prisma.purchaseRequestEvent.count({
        where: { purchaseRequestId: pr.id, type: 'PART_INSTALLED' },
      })
    ).toBe(1);
  });

  it('should enforce notification recipientId isolation: User A cannot read or mark User B notification as read', async () => {
    // Create notification for Finance User
    const notificationForFinance = await prisma.notification.create({
      data: {
        companyId: companyAId,
        recipientId: financeUser.id,
        type: 'PART_REQUESTED',
        title: 'Notificação Privada Financeiro',
        message: 'Apenas financeiro deve ler',
        entityType: 'PurchaseRequest',
        entityId: 'dummy-id',
      },
    });

    // Mechanic User attempts to mark Finance User's notification as read
    const readRes = await request(app)
      .patch(`/api/notifications/${notificationForFinance.id}/read`)
      .set('Authorization', `Bearer ${mechanicToken}`);

    expect(readRes.status).toBe(404);

    // Verify notification remains unread in database
    const notifInDb = await prisma.notification.findUnique({ where: { id: notificationForFinance.id } });
    expect(notifInDb!.readAt).toBeNull();
  });
});
