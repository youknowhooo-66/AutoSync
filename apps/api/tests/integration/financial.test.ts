import request from 'supertest';
import app from '../../src/app';
import { FactoryEngine } from '../factories/FactoryEngine';
import { generateAuthHeaders } from '../helpers/auth';
import { prismaClient } from '../../src/shared/database/prismaClient';

describe('Financial Integration Tests', () => {
  it('should successfully create, update, list, and delete a financial entry', async () => {
    // 1. Arrange
    const company = await FactoryEngine.createCompany();
    const branch = await FactoryEngine.createBranch(company.id);
    const user = await FactoryEngine.createUser(company.id, { role: 'ADMIN', branchId: branch.id });
    const headers = generateAuthHeaders(user);

    // 2. Act: Create Financial Entry (Expense)
    const createResponse = await request(app)
      .post('/api/financial')
      .set(headers)
      .send({
        type: 'EXPENSE',
        amount: 250.50,
        description: 'Compra de suprimentos para oficina',
        date: new Date().toISOString(),
        categoryId: 'OfficeSupplies'
      });

    // Assert Creation
    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toHaveProperty('id');
    expect(Number(createResponse.body.amount)).toBe(250.50);
    expect(createResponse.body.type).toBe('PAYABLE'); // Mapped to PAYABLE

    const recordId = createResponse.body.id;

    // 3. Act: Update Financial Entry
    const updateResponse = await request(app)
      .put(`/api/financial/${recordId}`)
      .set(headers)
      .send({
        id: recordId,
        type: 'INCOME',
        amount: 300.00,
        description: 'Venda de lubrificantes (Atualizado)',
        date: new Date().toISOString(),
        categoryId: 'Lubricants'
      });

    // Assert Update
    expect(updateResponse.status).toBe(200);
    expect(Number(updateResponse.body.amount)).toBe(300.00);
    expect(updateResponse.body.type).toBe('RECEIVABLE'); // Mapped to RECEIVABLE

    // 4. Act: List Financial Entries
    const listResponse = await request(app)
      .get('/api/financial')
      .set(headers);

    // Assert List
    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].id).toBe(recordId);

    // 5. Act: Delete Financial Entry
    const deleteResponse = await request(app)
      .delete(`/api/financial/${recordId}`)
      .set(headers);

    // Assert Delete
    expect(deleteResponse.status).toBe(204);

    // Check DB state
    const dbRecord = await prismaClient.financialRecord.findUnique({
      where: { id: recordId }
    });
    expect(dbRecord).toBeNull();
  });

  it('should successfully manage invoice sub-endpoints (detail, status, payment, pdf)', async () => {
    // 1. Arrange
    const company = await FactoryEngine.createCompany();
    const branch = await FactoryEngine.createBranch(company.id);
    const user = await FactoryEngine.createUser(company.id, { role: 'ADMIN', branchId: branch.id });
    const headers = generateAuthHeaders(user);

    // Create a financial record
    const record = await prismaClient.financialRecord.create({
      data: {
        companyId: company.id,
        branchId: branch.id,
        type: 'RECEIVABLE',
        category: 'SERVICE_ORDER',
        description: 'Revenue from OS #9999',
        amount: 1500.00,
        dueDate: new Date(),
        status: 'PENDING'
      }
    });

    // 2. Act: Get Invoice Detail
    const detailResponse = await request(app)
      .get(`/api/finance/invoices/${record.id}`)
      .set(headers);

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.id).toBe(record.id);
    expect(detailResponse.body.invoiceNumber).toBe(`FT-${record.id.substring(0, 8).toUpperCase()}`);
    expect(detailResponse.body.totalAmount).toBe(1500.00);
    expect(detailResponse.body.status).toBe('PENDING');

    // 3. Act: Update Status
    const statusResponse = await request(app)
      .patch(`/api/finance/invoices/${record.id}/status`)
      .set(headers)
      .send({ status: 'PAID' });

    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.record.status).toBe('PAID');

    // 4. Act: Add Payment
    const paymentResponse = await request(app)
      .post(`/api/finance/invoices/${record.id}/payments`)
      .set(headers)
      .send({ amount: 1500.00, method: 'PIX' });

    expect(paymentResponse.status).toBe(201);
    expect(paymentResponse.body.record.status).toBe('PAID');

    // 5. Act: Download PDF Receipt
    const pdfResponse = await request(app)
      .get(`/api/finance/invoices/${record.id}/pdf`)
      .set(headers);

    expect(pdfResponse.status).toBe(200);
    expect(pdfResponse.headers['content-type']).toBe('application/pdf');
  });
});

