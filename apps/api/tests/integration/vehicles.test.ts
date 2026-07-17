import request from 'supertest';
import app from '../../src/app';
import { FactoryEngine } from '../factories/FactoryEngine';
import { generateAuthHeaders } from '../helpers/auth';

describe('Vehicles CRUD & Multi-Tenant Integration Tests', () => {
  it('should successfully create, update, list, and delete a vehicle', async () => {
    // Arrange: Create Company, User, and Client
    const company = await FactoryEngine.createCompany();
    const user = await FactoryEngine.createUser(company.id, { role: 'ADMIN' });
    const client = await FactoryEngine.createClient(company.id, { name: 'Owner Client' });
    const headers = generateAuthHeaders(user);

    // 1. Create vehicle
    const createData = {
      clientId: client.id,
      plate: 'XYZ9876',
      brand: 'Honda',
      model: 'Civic',
      year: 2021,
      chassis: '1234567890abcdef',
      mileage: 12000,
      engine: '2.0 Turbo',
    };

    const createResponse = await request(app)
      .post('/api/vehicles')
      .set(headers)
      .send(createData);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toHaveProperty('success', true);
    expect(createResponse.body.data).toHaveProperty('id');
    expect(createResponse.body.data.plate).toBe(createData.plate);
    
    const vehicleId = createResponse.body.data.id;

    // 2. Prevent duplicate vehicle creation with the same license plate
    const duplicateResponse = await request(app)
      .post('/api/vehicles')
      .set(headers)
      .send({
        ...createData,
        clientId: client.id,
      });

    expect(duplicateResponse.status).toBe(409);
    expect(duplicateResponse.body.message).toMatch(/already exists/);

    // 3. Update vehicle details
    const updateData = {
      model: 'Civic Touring',
      year: 2022,
    };

    const updateResponse = await request(app)
      .put(`/api/vehicles/${vehicleId}`)
      .set(headers)
      .send(updateData);

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.model).toBe(updateData.model);
    expect(updateResponse.body.year).toBe(updateData.year);

    // 4. List vehicles
    const listResponse = await request(app)
      .get('/api/vehicles')
      .set(headers);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toBeInstanceOf(Array);
    const found = listResponse.body.find((v: any) => v.id === vehicleId);
    expect(found).toBeTruthy();
    expect(found.model).toBe(updateData.model);

    // 5. Delete vehicle
    const deleteResponse = await request(app)
      .delete(`/api/vehicles/${vehicleId}`)
      .set(headers);

    expect([200, 204]).toContain(deleteResponse.status);

    // 6. Verify vehicle is deleted
    const listAfterDelete = await request(app)
      .get('/api/vehicles')
      .set(headers);
    
    const deletedVehicle = listAfterDelete.body.find((v: any) => v.id === vehicleId);
    expect(deletedVehicle).toBeUndefined();
  });

  it('should strictly isolate CRUD actions and prevent cross-tenant operations', async () => {
    // Arrange: Create Company A, User A, Client A, and Vehicle A
    const companyA = await FactoryEngine.createCompany();
    const userA = await FactoryEngine.createUser(companyA.id, { role: 'ADMIN' });
    const clientA = await FactoryEngine.createClient(companyA.id, { name: 'Tenant A Client' });
    const vehicleA = await FactoryEngine.createVehicle(companyA.id, clientA.id, { plate: 'AAA1111' });
    const headersA = generateAuthHeaders(userA);

    // Arrange: Create Company B, User B, Client B
    const companyB = await FactoryEngine.createCompany();
    const userB = await FactoryEngine.createUser(companyB.id, { role: 'ADMIN' });
    const clientB = await FactoryEngine.createClient(companyB.id, { name: 'Tenant B Client' });
    const headersB = generateAuthHeaders(userB);

    // Act & Assert 1: User B tries to update User A's vehicle -> should return 404 Not Found
    const updateResponse = await request(app)
      .put(`/api/vehicles/${vehicleA.id}`)
      .set(headersB)
      .send({ model: 'Hacked Model' });

    expect(updateResponse.status).toBe(404);

    // Act & Assert 2: User B tries to delete User A's vehicle -> should return 404 Not Found
    const deleteResponse = await request(app)
      .delete(`/api/vehicles/${vehicleA.id}`)
      .set(headersB);

    expect(deleteResponse.status).toBe(404);

    // Act & Assert 3: User A tries to create a vehicle linked to Client B (cross-tenant relationship block) -> should return 404 Not Found
    const crossTenantCreate = await request(app)
      .post('/api/vehicles')
      .set(headersA)
      .send({
        clientId: clientB.id,
        plate: 'BBB2222',
        brand: 'Ford',
        model: 'Ka',
        year: 2019,
      });

    expect(crossTenantCreate.status).toBe(404);
    expect(crossTenantCreate.body.message).toMatch(/Client not found/);
  });
});
