import request from 'supertest';
import app from '../../src/app';
import { FactoryEngine } from '../factories/FactoryEngine';
import { generateAuthHeaders } from '../helpers/auth';
import { prismaClient } from '../../src/shared/database/prismaClient';

describe('Service Order Integration Tests', () => {
  it('should successfully create a service order and deduct stock', async () => {
    // 1. Arrange
    const company = await FactoryEngine.createCompany();
    const branch = await FactoryEngine.createBranch(company.id);
    const user = await FactoryEngine.createUser(company.id, { role: 'ADMIN', branchId: branch.id });
    const headers = generateAuthHeaders(user);

    const client = await FactoryEngine.createClient(company.id);
    const vehicle = await FactoryEngine.createVehicle(company.id, client.id);
    const part = await FactoryEngine.createPart(company.id, { purchasePrice: 50, salePrice: 100 });
    // Seed initial stock of 10 items
    await FactoryEngine.createStock(company.id, part.id, branch.id, 10);

    const osData = {
      clientId: client.id,
      vehicleId: vehicle.id,
      branchId: branch.id,
      notes: 'Troca de pastilha e alinhamento',
      parts: [
        {
          partId: part.id,
          quantity: 2,
          unitPrice: 100.00, // selling price
        }
      ],
      services: [
        {
          name: 'Alinhamento 3D',
          price: 150.00,
        }
      ]
    };

    // 2. Act
    const response = await request(app)
      .post('/api/service-orders')
      .set(headers)
      .send(osData);

    // 3. Assert
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toMatch(/Ordem de Serviço aberta com sucesso/);

    const serviceOrder = response.body.data;
    expect(serviceOrder).toHaveProperty('id');
    expect(Number(serviceOrder.totalParts)).toBe(200.00);
    expect(Number(serviceOrder.totalServices)).toBe(150.00);
    expect(Number(serviceOrder.finalValue)).toBe(350.00);

    // Check stock was decremented from 10 to 8
    const stock = await prismaClient.stock.findUnique({
      where: { partId_branchId: { partId: part.id, branchId: branch.id } }
    });
    expect(stock?.quantity).toBe(8);

    // Check movement was recorded
    const movement = await prismaClient.inventoryMovement.findFirst({
      where: { partId: part.id, type: 'OUT' }
    });
    expect(movement?.quantity).toBe(2);
    expect(movement?.reason).toMatch(/Service Order Created/);
  });

  it('should block service order creation if any part has insufficient stock', async () => {
    // 1. Arrange
    const company = await FactoryEngine.createCompany();
    const branch = await FactoryEngine.createBranch(company.id);
    const user = await FactoryEngine.createUser(company.id, { role: 'ADMIN', branchId: branch.id });
    const headers = generateAuthHeaders(user);

    const client = await FactoryEngine.createClient(company.id);
    const vehicle = await FactoryEngine.createVehicle(company.id, client.id);
    const part = await FactoryEngine.createPart(company.id);
    
    // Seed initial stock of only 1 item
    await FactoryEngine.createStock(company.id, part.id, branch.id, 1);

    const osData = {
      clientId: client.id,
      vehicleId: vehicle.id,
      branchId: branch.id,
      parts: [
        {
          partId: part.id,
          quantity: 5, // Requires 5, but stock is only 1
          unitPrice: 100.00,
        }
      ],
      services: []
    };

    // 2. Act
    const response = await request(app)
      .post('/api/service-orders')
      .set(headers)
      .send(osData);

    // 3. Assert
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/Insufficient stock for part/);
  });

  it('should update the status of service order through start, complete and cancel endpoints', async () => {
    // 1. Arrange
    const company = await FactoryEngine.createCompany();
    const branch = await FactoryEngine.createBranch(company.id);
    const user = await FactoryEngine.createUser(company.id, { role: 'ADMIN', branchId: branch.id });
    const headers = generateAuthHeaders(user);

    const client = await FactoryEngine.createClient(company.id);
    const vehicle = await FactoryEngine.createVehicle(company.id, client.id);
    
    const serviceOrder = await FactoryEngine.createServiceOrder(company.id, client.id, vehicle.id, branch.id);

    // 2. Act & Assert: Start OS
    const startResponse = await request(app)
      .patch(`/api/service-orders/${serviceOrder.id}/start`)
      .set(headers);
    expect(startResponse.status).toBe(200);
    expect(startResponse.body.data.status).toBe('IN_PROGRESS');

    // Act & Assert: Complete OS
    const completeResponse = await request(app)
      .patch(`/api/service-orders/${serviceOrder.id}/complete`)
      .set(headers);
    expect(completeResponse.status).toBe(200);
    expect(completeResponse.body.data.status).toBe('FINISHED');
  });
});
