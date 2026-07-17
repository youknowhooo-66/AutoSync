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

  describe('PUT /api/service-orders/:id/diagnosis', () => {
    it('should successfully register a diagnosis, transition status to IN_PROGRESS, and preserve opening notes', async () => {
      const company = await FactoryEngine.createCompany();
      const branch = await FactoryEngine.createBranch(company.id);
      const user = await FactoryEngine.createUser(company.id, { role: 'MECHANIC', branchId: branch.id });
      const client = await FactoryEngine.createClient(company.id);
      const vehicle = await FactoryEngine.createVehicle(company.id, client.id);

      // Create a service order with opening notes
      const headers = generateAuthHeaders(user);
      const createResponse = await request(app)
        .post('/api/service-orders')
        .set(generateAuthHeaders(await FactoryEngine.createUser(company.id, { role: 'ADMIN' })))
        .send({
          clientId: client.id,
          vehicleId: vehicle.id,
          branchId: branch.id,
          notes: 'Customer notes: engine check.'
        });
      
      const osId = createResponse.body.data.id;
      expect(createResponse.body.data.status).toBe('OPEN');

      // Now register a diagnosis as MECHANIC
      const diagnosisResponse = await request(app)
        .put(`/api/service-orders/${osId}/diagnosis`)
        .set(headers)
        .send({ description: 'Found visual leak at radiator terminal.' });

      expect(diagnosisResponse.status).toBe(200);
      expect(diagnosisResponse.body.success).toBe(true);
      expect(diagnosisResponse.body.data.serviceOrderId).toBe(osId);
      expect(diagnosisResponse.body.data.description).toBe('Found visual leak at radiator terminal.');
      expect(diagnosisResponse.body.data.status).toBe('IN_PROGRESS'); // Transitions OPEN -> IN_PROGRESS

      // Confirm in DB that notes contains both customer notes and technical diagnosis header
      const showResponse = await request(app)
        .get(`/api/service-orders/${osId}`)
        .set(headers);

      expect(showResponse.body.notes).toContain('Customer notes: engine check.');
      expect(showResponse.body.notes).toContain('[DIAGNÓSTICO TÉCNICO]');
      expect(showResponse.body.notes).toContain('Found visual leak at radiator terminal.');
    });

    it('should block unauthorized roles with 403 and other tenants with 404', async () => {
      const companyA = await FactoryEngine.createCompany();
      const branchA = await FactoryEngine.createBranch(companyA.id);
      const adminA = await FactoryEngine.createUser(companyA.id, { role: 'ADMIN', branchId: branchA.id });
      const clientA = await FactoryEngine.createClient(companyA.id);
      const vehicleA = await FactoryEngine.createVehicle(companyA.id, clientA.id);

      const createResponse = await request(app)
        .post('/api/service-orders')
        .set(generateAuthHeaders(adminA))
        .send({ clientId: clientA.id, vehicleId: vehicleA.id, branchId: branchA.id });
      
      const osId = createResponse.body.data.id;

      // 1. Attendant tries to diagnose -> 403 Forbidden
      const attendantA = await FactoryEngine.createUser(companyA.id, { role: 'ATTENDANT', branchId: branchA.id });
      const resAttendant = await request(app)
        .put(`/api/service-orders/${osId}/diagnosis`)
        .set(generateAuthHeaders(attendantA))
        .send({ description: 'Radiator replacement required.' });
      expect(resAttendant.status).toBe(403);

      // 2. Tenant B (Mechanic) tries to diagnose Tenant A's OS -> 404 Not Found
      const companyB = await FactoryEngine.createCompany();
      const branchB = await FactoryEngine.createBranch(companyB.id);
      const mechanicB = await FactoryEngine.createUser(companyB.id, { role: 'MECHANIC', branchId: branchB.id });
      const resCross = await request(app)
        .put(`/api/service-orders/${osId}/diagnosis`)
        .set(generateAuthHeaders(mechanicB))
        .send({ description: 'Malicious diagnosis attempt.' });
      expect(resCross.status).toBe(404);
    });

    it('should reject invalid description lengths with 400', async () => {
      const company = await FactoryEngine.createCompany();
      const branch = await FactoryEngine.createBranch(company.id);
      const admin = await FactoryEngine.createUser(company.id, { role: 'ADMIN', branchId: branch.id });
      const client = await FactoryEngine.createClient(company.id);
      const vehicle = await FactoryEngine.createVehicle(company.id, client.id);

      const createResponse = await request(app)
        .post('/api/service-orders')
        .set(generateAuthHeaders(admin))
        .send({ clientId: client.id, vehicleId: vehicle.id, branchId: branch.id });
      
      const osId = createResponse.body.data.id;

      // Empty or too short description -> 400 Bad Request
      const response = await request(app)
        .put(`/api/service-orders/${osId}/diagnosis`)
        .set(generateAuthHeaders(admin))
        .send({ description: 'No' });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
    });

    it('should correctly parse and replace diagnosis string without duplicating markers or losing opening notes', async () => {
      const company = await FactoryEngine.createCompany();
      const branch = await FactoryEngine.createBranch(company.id);
      const admin = await FactoryEngine.createUser(company.id, { role: 'ADMIN', branchId: branch.id });
      const client = await FactoryEngine.createClient(company.id);
      const vehicle = await FactoryEngine.createVehicle(company.id, client.id);
      const headers = generateAuthHeaders(admin);

      const createResponse = await request(app)
        .post('/api/service-orders')
        .set(headers)
        .send({ clientId: client.id, vehicleId: vehicle.id, branchId: branch.id, notes: 'Initial problem: tires.' });
      
      const osId = createResponse.body.data.id;

      // 1. Initial diagnosis (notes currently has only observations)
      await request(app)
        .put(`/api/service-orders/${osId}/diagnosis`)
        .set(headers)
        .send({ description: 'Front left tire punctured.' });
      
      let showResponse = await request(app).get(`/api/service-orders/${osId}`).set(headers);
      expect(showResponse.body.notes).toBe('Initial problem: tires.\n\n[DIAGNÓSTICO TÉCNICO]\nFront left tire punctured.');

      // 2. Double update (notes already has a diagnosis)
      await request(app)
        .put(`/api/service-orders/${osId}/diagnosis`)
        .set(headers)
        .send({ description: 'Front left tire punctured.\nAlignment needed.' });
      
      showResponse = await request(app).get(`/api/service-orders/${osId}`).set(headers);
      // Ensure marker is not duplicated and previous notes remain
      expect(showResponse.body.notes).toBe('Initial problem: tires.\n\n[DIAGNÓSTICO TÉCNICO]\nFront left tire punctured.\nAlignment needed.');

      // 3. Test with initially empty notes
      const createEmptyResponse = await request(app)
        .post('/api/service-orders')
        .set(headers)
        .send({ clientId: client.id, vehicleId: vehicle.id, branchId: branch.id }); // no notes
      const osIdEmpty = createEmptyResponse.body.data.id;

      await request(app)
        .put(`/api/service-orders/${osIdEmpty}/diagnosis`)
        .set(headers)
        .send({ description: 'Battery dead.' });
      
      const showEmptyResponse = await request(app).get(`/api/service-orders/${osIdEmpty}`).set(headers);
      expect(showEmptyResponse.body.notes).toBe('[DIAGNÓSTICO TÉCNICO]\nBattery dead.');
    });
  });
});
