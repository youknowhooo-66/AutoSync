import request from 'supertest';
import app from '../../src/app';
import { FactoryEngine } from '../factories/FactoryEngine';
import { generateAuthHeaders } from '../helpers/auth';

describe('Clients CRUD & Multi-Tenant Integration Tests', () => {
  it('should successfully create, update, list, and delete a client', async () => {
    // Arrange: Create Company and User
    const company = await FactoryEngine.createCompany();
    const user = await FactoryEngine.createUser(company.id, { role: 'ADMIN' });
    const headers = generateAuthHeaders(user);

    // 1. Create client
    const createData = {
      name: 'Client Test Integration',
      document: '11122233344',
      email: 'client-test-integration@example.com',
      phone: '11999999999',
      whatsapp: '11999999999',
      address: 'Test Street, 123',
    };

    const createResponse = await request(app)
      .post('/api/clients')
      .set(headers)
      .send(createData);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toHaveProperty('success', true);
    expect(createResponse.body.data).toHaveProperty('id');
    expect(createResponse.body.data.name).toBe(createData.name);
    
    const clientId = createResponse.body.data.id;

    // 2. Prevent duplicate client creation by name for the same company
    const duplicateResponse = await request(app)
      .post('/api/clients')
      .set(headers)
      .send(createData);

    expect(duplicateResponse.status).toBe(409);
    expect(duplicateResponse.body.message).toMatch(/already exists/);

    // 3. Update client details
    const updateData = {
      name: 'Client Test Integration Updated',
      email: 'client-updated@example.com',
    };

    const updateResponse = await request(app)
      .put(`/api/clients/${clientId}`)
      .set(headers)
      .send(updateData);

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.name).toBe(updateData.name);
    expect(updateResponse.body.data.email).toBe(updateData.email);

    // 4. List clients
    const listResponse = await request(app)
      .get('/api/clients')
      .set(headers);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toBeInstanceOf(Array);
    const found = listResponse.body.find((c: any) => c.id === clientId);
    expect(found).toBeTruthy();
    expect(found.name).toBe(updateData.name);

    // 5. Delete client
    const deleteResponse = await request(app)
      .delete(`/api/clients/${clientId}`)
      .set(headers);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toHaveProperty('success', true);

    // 6. Verify client is deleted
    const listAfterDelete = await request(app)
      .get('/api/clients')
      .set(headers);
    
    const deletedClient = listAfterDelete.body.find((c: any) => c.id === clientId);
    expect(deletedClient).toBeUndefined();
  });

  it('should strictly isolate CRUD actions and prevent cross-tenant operations', async () => {
    // Arrange: Create Company A, User A, and Client A
    const companyA = await FactoryEngine.createCompany();
    const userA = await FactoryEngine.createUser(companyA.id, { role: 'ADMIN' });
    const clientA = await FactoryEngine.createClient(companyA.id, { name: 'Tenant A Client' });
    const headersA = generateAuthHeaders(userA);

    // Arrange: Create Company B, User B
    const companyB = await FactoryEngine.createCompany();
    const userB = await FactoryEngine.createUser(companyB.id, { role: 'ADMIN' });
    const headersB = generateAuthHeaders(userB);

    // Act & Assert 1: User B tries to update User A's client -> should return 404 Not Found
    const updateResponse = await request(app)
      .put(`/api/clients/${clientA.id}`)
      .set(headersB)
      .send({ name: 'Hacked name' });

    expect(updateResponse.status).toBe(404);

    // Act & Assert 2: User B tries to delete User A's client -> should return 404 Not Found
    const deleteResponse = await request(app)
      .delete(`/api/clients/${clientA.id}`)
      .set(headersB);

    expect(deleteResponse.status).toBe(404);
  });
});
