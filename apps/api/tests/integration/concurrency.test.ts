import request from 'supertest';
import app from '../../src/app';
import { FactoryEngine } from '../factories/FactoryEngine';
import { generateAuthHeaders } from '../helpers/auth';
import { prismaClient } from '../../src/shared/database/prismaClient';

describe('Concurrency & Lock Integration Tests', () => {
  it('should prevent race conditions on simultaneous stock consumption', async () => {
    // 1. Arrange
    const company = await FactoryEngine.createCompany();
    const branch = await FactoryEngine.createBranch(company.id);
    const userA = await FactoryEngine.createUser(company.id, { role: 'ADMIN', branchId: branch.id });
    const userB = await FactoryEngine.createUser(company.id, { role: 'ADMIN', branchId: branch.id });

    const clientA = await FactoryEngine.createClient(company.id);
    const clientB = await FactoryEngine.createClient(company.id);
    const vehicleA = await FactoryEngine.createVehicle(company.id, clientA.id);
    const vehicleB = await FactoryEngine.createVehicle(company.id, clientB.id);

    const part = await FactoryEngine.createPart(company.id, { purchasePrice: 50, salePrice: 100 });
    // Seed exactly 1 unit of stock
    await FactoryEngine.createStock(company.id, part.id, branch.id, 1);

    const osDataA = {
      clientId: clientA.id,
      vehicleId: vehicleA.id,
      branchId: branch.id,
      parts: [{ partId: part.id, quantity: 1, unitPrice: 100.00 }],
      services: []
    };

    const osDataB = {
      clientId: clientB.id,
      vehicleId: vehicleB.id,
      branchId: branch.id,
      parts: [{ partId: part.id, quantity: 1, unitPrice: 100.00 }],
      services: []
    };

    const headersA = generateAuthHeaders(userA);
    const headersB = generateAuthHeaders(userB);

    // 2. Act: Send both requests concurrently
    const [responseA, responseB] = await Promise.all([
      request(app).post('/api/service-orders').set(headersA).send(osDataA),
      request(app).post('/api/service-orders').set(headersB).send(osDataB)
    ]);

    // 3. Assert: One must succeed (201) and the other must fail (400)
    const statuses = [responseA.status, responseB.status];
    expect(statuses).toContain(201);
    expect(statuses).toContain(400);

    // Confirm that the failing response returns the "Insufficient stock" error message
    const errorResponse = responseA.status === 400 ? responseA : responseB;
    expect(errorResponse.body.message).toMatch(/Insufficient stock/);

    // Confirm final stock quantity in DB is exactly 0 (no negative stock allowed!)
    const stock = await prismaClient.stock.findUnique({
      where: { partId_branchId: { partId: part.id, branchId: branch.id } }
    });
    expect(stock?.quantity).toBe(0);
  });
});
