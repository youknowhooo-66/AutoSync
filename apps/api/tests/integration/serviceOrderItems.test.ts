import request from 'supertest';
import app from '../../src/app';
import { FactoryEngine } from '../factories/FactoryEngine';
import { generateAuthHeaders } from '../helpers/auth';
import { prismaClient } from '../../src/shared/database/prismaClient';
import { Prisma } from '@prisma/client';

describe('Service Order Items (P4.3)', () => {
  it('should add a part as planned need without deducting stock or creating movement', async () => {
    const company = await FactoryEngine.createCompany();
    const branch = await FactoryEngine.createBranch(company.id);
    const admin = await FactoryEngine.createUser(company.id, { role: 'ADMIN', branchId: branch.id });
    const client = await FactoryEngine.createClient(company.id);
    const vehicle = await FactoryEngine.createVehicle(company.id, client.id);
    
    // Create Part and Stock
    const part = await FactoryEngine.createPart(company.id, { salePrice: new Prisma.Decimal('15.50') } as any);
    const stock = await prismaClient.stock.create({
      data: {
        companyId: company.id,
        branchId: branch.id,
        partId: part.id,
        quantity: 2, // Only 2 in stock
      }
    });

    const headers = generateAuthHeaders(admin);

    // Create OS
    const createResponse = await request(app)
      .post('/api/service-orders')
      .set(headers)
      .send({ clientId: client.id, vehicleId: vehicle.id, branchId: branch.id });
    
    const osId = createResponse.body.data.id;

    // Add Part (requesting 4 units, which is > stock, but should pass as planned need)
    const addResponse = await request(app)
      .post(`/api/service-orders/${osId}/items`)
      .set(headers)
      .send({
        parts: [{ stockId: stock.id, quantity: 4 }]
      });

    expect(addResponse.status).toBe(200);
    expect(addResponse.body.success).toBe(true);
    
    // Verify OS totals (4 * 15.50 = 62.00)
    expect(Number(addResponse.body.data.totalParts)).toBe(62);
    expect(Number(addResponse.body.data.finalValue)).toBe(62);

    // Verify stock is untouched
    const currentStock = await prismaClient.stock.findUnique({ where: { id: stock.id } });
    expect(Number(currentStock?.quantity)).toBe(2); // Untouched

    // Verify no movement created
    const movements = await prismaClient.inventoryMovement.findMany({ where: { partId: part.id } });
    expect(movements.length).toBe(0);
  });

  it('should return 404 when trying to add a part from another tenant', async () => {
    const companyA = await FactoryEngine.createCompany();
    const branchA = await FactoryEngine.createBranch(companyA.id);
    const adminA = await FactoryEngine.createUser(companyA.id, { role: 'ADMIN', branchId: branchA.id });
    const clientA = await FactoryEngine.createClient(companyA.id);
    const vehicleA = await FactoryEngine.createVehicle(companyA.id, clientA.id);

    const companyB = await FactoryEngine.createCompany();
    const branchB = await FactoryEngine.createBranch(companyB.id);
    const partB = await FactoryEngine.createPart(companyB.id);
    const stockB = await prismaClient.stock.create({
      data: { companyId: companyB.id, branchId: branchB.id, partId: partB.id, quantity: 10 }
    });

    const headersA = generateAuthHeaders(adminA);

    const createResponse = await request(app)
      .post('/api/service-orders')
      .set(headersA)
      .send({ clientId: clientA.id, vehicleId: vehicleA.id, branchId: branchA.id });
    const osId = createResponse.body.data.id;

    const addResponse = await request(app)
      .post(`/api/service-orders/${osId}/items`)
      .set(headersA)
      .send({
        parts: [{ stockId: stockB.id, quantity: 1 }]
      });

    expect(addResponse.status).toBe(404); // Tenant isolation check
  });

  it('should calculate total with services and support item removal', async () => {
    const company = await FactoryEngine.createCompany();
    const branch = await FactoryEngine.createBranch(company.id);
    const admin = await FactoryEngine.createUser(company.id, { role: 'ADMIN', branchId: branch.id });
    const client = await FactoryEngine.createClient(company.id);
    const vehicle = await FactoryEngine.createVehicle(company.id, client.id);
    
    const headers = generateAuthHeaders(admin);
    const createResponse = await request(app)
      .post('/api/service-orders')
      .set(headers)
      .send({ clientId: client.id, vehicleId: vehicle.id, branchId: branch.id });
    const osId = createResponse.body.data.id;

    // Add service
    const addResponse = await request(app)
      .post(`/api/service-orders/${osId}/items`)
      .set(headers)
      .send({
        services: [{ description: 'Oil Change', quantity: 2, unitPrice: '50.00' }]
      });

    expect(addResponse.status).toBe(200);
    expect(Number(addResponse.body.data.totalServices)).toBe(100);
    expect(Number(addResponse.body.data.finalValue)).toBe(100);

    const serviceId = addResponse.body.data.services[0].id;

    // Remove service
    const removeResponse = await request(app)
      .delete(`/api/service-orders/${osId}/items/${serviceId}?type=SERVICE`)
      .set(headers);

    expect(removeResponse.status).toBe(200);
    expect(Number(removeResponse.body.data.totalServices)).toBe(0);
    expect(Number(removeResponse.body.data.finalValue)).toBe(0);
  });

  it('should block adding items to FINISHED OS', async () => {
    const company = await FactoryEngine.createCompany();
    const branch = await FactoryEngine.createBranch(company.id);
    const admin = await FactoryEngine.createUser(company.id, { role: 'ADMIN', branchId: branch.id });
    const client = await FactoryEngine.createClient(company.id);
    const vehicle = await FactoryEngine.createVehicle(company.id, client.id);
    
    const headers = generateAuthHeaders(admin);
    const createResponse = await request(app)
      .post('/api/service-orders')
      .set(headers)
      .send({ clientId: client.id, vehicleId: vehicle.id, branchId: branch.id });
    const osId = createResponse.body.data.id;

    // Finish OS
    await prismaClient.serviceOrder.update({
      where: { id: osId },
      data: { status: 'FINISHED' }
    });

    // Try to add
    const addResponse = await request(app)
      .post(`/api/service-orders/${osId}/items`)
      .set(headers)
      .send({ services: [{ description: 'Late addition', quantity: 1, unitPrice: '10.00' }] });

    expect(addResponse.status).toBe(400);
  });
});
