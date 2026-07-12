import request from 'supertest';
import app from '../../src/app';
import { FactoryEngine } from '../factories/FactoryEngine';
import { generateAuthHeaders } from '../helpers/auth';

describe('ServiceOrders Basic Creation & Security Integration Tests', () => {
  it('should successfully create, list, and read a basic service order, ignoring forged body parameters', async () => {
    // Arrange: Create Tenant A structure
    const company = await FactoryEngine.createCompany();
    const branch = await FactoryEngine.createBranch(company.id, { name: 'Main Branch' });
    const user = await FactoryEngine.createUser(company.id, { role: 'ADMIN', branchId: branch.id });
    const client = await FactoryEngine.createClient(company.id, { name: 'Owner Client' });
    const vehicle = await FactoryEngine.createVehicle(company.id, client.id, { plate: 'ABC1234' });
    const mechanic = await FactoryEngine.createUser(company.id, { role: 'MECHANIC', branchId: branch.id });
    const headers = generateAuthHeaders(user);

    // 1. Create a service order
    const createData = {
      clientId: client.id,
      vehicleId: vehicle.id,
      branchId: branch.id,
      mechanicId: mechanic.id,
      notes: 'Symptom: engine light is blinking.',
      // Forged attributes which MUST be ignored or overridden by backend
      companyId: 'fake-company-id',
      status: 'FINISHED',
    };

    const createResponse = await request(app)
      .post('/api/service-orders')
      .set(headers)
      .send(createData);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toHaveProperty('success', true);
    expect(createResponse.body.data).toHaveProperty('id');
    expect(createResponse.body.data.companyId).toBe(company.id); // Must use authenticated user companyId, not forged
    expect(createResponse.body.data.status).toBe('OPEN'); // Initial status must be OPEN, not forged
    
    const osId = createResponse.body.data.id;

    // 2. Fetch specific service order details
    const showResponse = await request(app)
      .get(`/api/service-orders/${osId}`)
      .set(headers);

    expect(showResponse.status).toBe(200);
    expect(showResponse.body.id).toBe(osId);
    expect(showResponse.body.notes).toBe(createData.notes);
    expect(showResponse.body.client.name).toBe('Owner Client');
    expect(showResponse.body.vehicle.plate).toBe('ABC1234');
    expect(showResponse.body.branch.name).toBe('Main Branch');

    // 3. List service orders
    const listResponse = await request(app)
      .get('/api/service-orders')
      .set(headers);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toBeInstanceOf(Array);
    const found = listResponse.body.find((os: any) => os.id === osId);
    expect(found).toBeTruthy();
  });

  it('should enforce role-based access control (RBAC) on service order creation', async () => {
    const company = await FactoryEngine.createCompany();
    const branch = await FactoryEngine.createBranch(company.id);
    const client = await FactoryEngine.createClient(company.id);
    const vehicle = await FactoryEngine.createVehicle(company.id, client.id);

    // Create users with different roles
    const attendant = await FactoryEngine.createUser(company.id, { role: 'ATTENDANT', branchId: branch.id });
    const manager = await FactoryEngine.createUser(company.id, { role: 'MANAGER', branchId: branch.id });
    const mechanic = await FactoryEngine.createUser(company.id, { role: 'MECHANIC', branchId: branch.id });
    const financial = await FactoryEngine.createUser(company.id, { role: 'FINANCIAL', branchId: branch.id });

    const createData = {
      clientId: client.id,
      vehicleId: vehicle.id,
      branchId: branch.id,
    };

    // Attendant -> Allowed
    const resAttendant = await request(app)
      .post('/api/service-orders')
      .set(generateAuthHeaders(attendant))
      .send(createData);
    expect(resAttendant.status).toBe(201);

    // Manager -> Allowed
    const resManager = await request(app)
      .post('/api/service-orders')
      .set(generateAuthHeaders(manager))
      .send(createData);
    expect(resManager.status).toBe(201);

    // Mechanic -> Forbidden
    const resMechanic = await request(app)
      .post('/api/service-orders')
      .set(generateAuthHeaders(mechanic))
      .send(createData);
    expect(resMechanic.status).toBe(403);

    // Financial -> Forbidden
    const resFinancial = await request(app)
      .post('/api/service-orders')
      .set(generateAuthHeaders(financial))
      .send(createData);
    expect(resFinancial.status).toBe(403);
  });

  it('should strictly reject cross-tenant relations and incorrect vehicle-client owner combinations', async () => {
    // Company A elements
    const companyA = await FactoryEngine.createCompany();
    const branchA = await FactoryEngine.createBranch(companyA.id);
    const userA = await FactoryEngine.createUser(companyA.id, { role: 'ADMIN', branchId: branchA.id });
    const clientA = await FactoryEngine.createClient(companyA.id);
    const vehicleA = await FactoryEngine.createVehicle(companyA.id, clientA.id);
    const headersA = generateAuthHeaders(userA);

    // Company B elements
    const companyB = await FactoryEngine.createCompany();
    const branchB = await FactoryEngine.createBranch(companyB.id);
    const clientB = await FactoryEngine.createClient(companyB.id);
    const vehicleB = await FactoryEngine.createVehicle(companyB.id, clientB.id);

    // Scenario 1: Tenant A tries to use Branch B -> 404
    const resBranch = await request(app)
      .post('/api/service-orders')
      .set(headersA)
      .send({ clientId: clientA.id, vehicleId: vehicleA.id, branchId: branchB.id });
    expect(resBranch.status).toBe(404);

    // Scenario 2: Tenant A tries to use Client B -> 404
    const resClient = await request(app)
      .post('/api/service-orders')
      .set(headersA)
      .send({ clientId: clientB.id, vehicleId: vehicleA.id, branchId: branchA.id });
    expect(resClient.status).toBe(404);

    // Scenario 3: Tenant A tries to use Vehicle B -> 404
    const resVehicle = await request(app)
      .post('/api/service-orders')
      .set(headersA)
      .send({ clientId: clientA.id, vehicleId: vehicleB.id, branchId: branchA.id });
    expect(resVehicle.status).toBe(404);

    // Scenario 4: Tenant A uses Client A but with Vehicle belonging to Client B -> 404
    const clientA2 = await FactoryEngine.createClient(companyA.id);
    const vehicleA2 = await FactoryEngine.createVehicle(companyA.id, clientA2.id); // Owned by clientA2
    const resMismatch = await request(app)
      .post('/api/service-orders')
      .set(headersA)
      .send({ clientId: clientA.id, vehicleId: vehicleA2.id, branchId: branchA.id });
    expect(resMismatch.status).toBe(404);
  });
});
