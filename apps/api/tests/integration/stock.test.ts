import request from 'supertest';
import app from '../../src/app';
import { FactoryEngine } from '../factories/FactoryEngine';
import { generateAuthHeaders } from '../helpers/auth';
import { prismaClient } from '../../src/shared/database/prismaClient';

describe('Stock Integration Tests', () => {
  it('should create a part and perform stock entry successfully', async () => {
    // 1. Arrange
    const company = await FactoryEngine.createCompany();
    const branch = await FactoryEngine.createBranch(company.id);
    const user = await FactoryEngine.createUser(company.id, { role: 'ADMIN', branchId: branch.id });
    const headers = generateAuthHeaders(user);

    // Create a part via API
    const createPartResponse = await request(app)
      .post('/api/stock/parts')
      .set(headers)
      .send({
        name: 'Alternador 12V',
        internalCode: 'ALT-12345',
        purchasePrice: 150.00,
        salePrice: 300.00,
        minStock: 2,
      });

    expect(createPartResponse.status).toBe(201);
    const part = createPartResponse.body.data;
    expect(part).toHaveProperty('id');

    // 2. Act: Perform Stock Entry
    const entryResponse = await request(app)
      .post('/api/stock/entry')
      .set(headers)
      .send({
        branchId: branch.id,
        partId: part.id,
        quantity: 15,
        unitCost: 160.00, // Updated purchase cost
      });

    // 3. Assert
    expect(entryResponse.status).toBe(201);
    expect(entryResponse.body.success).toBe(true);

    // Assert database state is correct
    const stock = await prismaClient.stock.findFirst({
      where: { partId: part.id, branchId: branch.id },
    });
    expect(stock?.quantity).toBe(15);

    // Verify part purchase price was updated
    const updatedPart = await prismaClient.part.findUnique({
      where: { id: part.id },
    });
    expect(Number(updatedPart?.purchasePrice)).toBe(160.00);

    // Verify movement was registered
    const movement = await prismaClient.inventoryMovement.findFirst({
      where: { partId: part.id, type: 'IN' },
    });
    expect(movement?.quantity).toBe(15);
    expect(movement?.userId).toBe(user.id);
  });

  it('should transfer stock between different branches successfully', async () => {
    // 1. Arrange
    const company = await FactoryEngine.createCompany();
    const branchA = await FactoryEngine.createBranch(company.id);
    const branchB = await FactoryEngine.createBranch(company.id);
    const user = await FactoryEngine.createUser(company.id, { role: 'ADMIN', branchId: branchA.id });
    const headers = generateAuthHeaders(user);

    const part = await FactoryEngine.createPart(company.id, { purchasePrice: 100, salePrice: 200 });
    // Seed branch A with stock
    await FactoryEngine.createStock(company.id, part.id, branchA.id, 10);

    // 2. Act: Transfer 4 units from branch A to branch B
    const response = await request(app)
      .post('/api/stock/transfer')
      .set(headers)
      .send({
        partId: part.id,
        sourceBranchId: branchA.id,
        targetBranchId: branchB.id,
        quantity: 4,
      });

    // 3. Assert
    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/Transferência realizada com sucesso/);

    // Assert final stock levels
    const stockA = await prismaClient.stock.findUnique({
      where: { partId_branchId: { partId: part.id, branchId: branchA.id } },
    });
    const stockB = await prismaClient.stock.findUnique({
      where: { partId_branchId: { partId: part.id, branchId: branchB.id } },
    });

    expect(stockA?.quantity).toBe(6);
    expect(stockB?.quantity).toBe(4);

    // Assert inventory movement was recorded
    const movement = await prismaClient.inventoryMovement.findFirst({
      where: { partId: part.id, type: 'TRANSFER' },
    });
    expect(movement?.sourceBranchId).toBe(branchA.id);
    expect(movement?.targetBranchId).toBe(branchB.id);
    expect(movement?.quantity).toBe(4);
  });

  it('should fail to transfer stock if quantity is insufficient', async () => {
    const company = await FactoryEngine.createCompany();
    const branchA = await FactoryEngine.createBranch(company.id);
    const branchB = await FactoryEngine.createBranch(company.id);
    const user = await FactoryEngine.createUser(company.id, { role: 'ADMIN', branchId: branchA.id });
    const headers = generateAuthHeaders(user);

    const part = await FactoryEngine.createPart(company.id);
    await FactoryEngine.createStock(company.id, part.id, branchA.id, 5);

    const response = await request(app)
      .post('/api/stock/transfer')
      .set(headers)
      .send({
        partId: part.id,
        sourceBranchId: branchA.id,
        targetBranchId: branchB.id,
        quantity: 10, // Exceeds available stock of 5
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/Insufficient stock/);
  });

  it('should block transfer when source and target branches are identical', async () => {
    const company = await FactoryEngine.createCompany();
    const branch = await FactoryEngine.createBranch(company.id);
    const user = await FactoryEngine.createUser(company.id, { role: 'ADMIN', branchId: branch.id });
    const headers = generateAuthHeaders(user);

    const part = await FactoryEngine.createPart(company.id);

    const response = await request(app)
      .post('/api/stock/transfer')
      .set(headers)
      .send({
        partId: part.id,
        sourceBranchId: branch.id,
        targetBranchId: branch.id,
        quantity: 5,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/Source and Target branches must be different/);
  });
});
