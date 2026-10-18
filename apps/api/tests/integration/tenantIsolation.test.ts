import request from 'supertest';
import app from '../../src/app';
import { prismaClient } from '../../src/shared/database/prismaClient';
import { healthRouter } from '../../src/shared/infra/http/health.routes';
import { authRoutes } from '../../src/modules/auth/routes/auth.routes';
import { clientsRoutes } from '../../src/modules/clients/routes/clients.routes';
import { vehiclesRoutes } from '../../src/modules/vehicles/routes/vehicles.routes';
import { serviceOrderRouter } from '../../src/modules/serviceOrders/routes/serviceOrders.routes';
import { stockRoutes } from '../../src/modules/stock/routes/stock.routes';
import { suppliersRoutes } from '../../src/modules/stock/routes/suppliers.routes';
import { financialRoutes } from '../../src/modules/financial/routes/financial.routes';
import { usersRoutes } from '../../src/modules/users/routes/users.routes';
import { companiesRoutes } from '../../src/modules/companies/routes/companies.routes';
import { dashboardRouter } from '../../src/modules/dashboard/routes/dashboard.routes';
import branchRoutes from '../../src/routes/branchRoutes';
import auditRoutes from '../../src/routes/auditRoutes';
import { FactoryEngine } from '../factories/FactoryEngine';
import { generateAuthHeaders } from '../helpers/auth';
import { listRoutes, type MountSpec } from '../helpers/routes';

/**
 * Cross-tenant isolation suite (DELIVERY_PLAN step 2).
 *
 * An ADMIN of company A calls every route aimed at company B's data. A route is
 * isolated when the response is a 4xx, carries none of B's ids or marker, and
 * B's rows are byte-for-byte unchanged afterwards. List routes may answer 2xx
 * but must not include B's data.
 *
 * Known holes are declared with `it.fails`: CI stays green while the hole exists,
 * and the test turns red the moment it is fixed, so it must then become `it`.
 */

const MOUNTS: MountSpec[] = [
  { prefix: '/health', router: healthRouter },
  { prefix: '/api/auth', router: authRoutes },
  { prefix: '/api/clients', router: clientsRoutes },
  { prefix: '/api/vehicles', router: vehiclesRoutes },
  { prefix: '/api/service-orders', router: serviceOrderRouter },
  { prefix: '/api/os', router: serviceOrderRouter, alias: true },
  { prefix: '/api/stock', router: stockRoutes },
  { prefix: '/api/inventory', router: stockRoutes, alias: true },
  { prefix: '/api/suppliers', router: suppliersRoutes },
  { prefix: '/api/financial', router: financialRoutes },
  { prefix: '/api/finance', router: financialRoutes, alias: true },
  { prefix: '/api/users', router: usersRoutes },
  { prefix: '/api/companies', router: companiesRoutes },
  { prefix: '/api/branches', router: branchRoutes },
  { prefix: '/api/dashboard', router: dashboardRouter },
  { prefix: '/api/audit', router: auditRoutes },
  { prefix: '/api/auditoria', router: auditRoutes, alias: true },
];

/** Routes that never touch tenant data, so there is nothing to isolate. */
const PUBLIC_ROUTES = new Set([
  'GET /health',
  'GET /health/live',
  'GET /health/ready',
  'POST /api/auth/sessions',
  'POST /api/auth/login',
]);

const MARKER = 'TENANT_B_SECRET';

type Seed = Awaited<ReturnType<typeof seedTenant>>;

async function seedTenant(label: string) {
  const company = await FactoryEngine.createCompany({ name: `${label} company` });
  const branch = await FactoryEngine.createBranch(company.id, { name: `${label} branch` });
  const admin = await FactoryEngine.createUser(company.id, { role: 'ADMIN', branchId: branch.id, name: `${label} admin` });
  const mechanic = await FactoryEngine.createUser(company.id, { role: 'MECHANIC', branchId: branch.id, name: `${label} mechanic` });
  const client = await FactoryEngine.createClient(company.id, { name: `${label} client` });
  const vehicle = await FactoryEngine.createVehicle(company.id, client.id);
  const part = await FactoryEngine.createPart(company.id, { name: `${label} part` });
  const stock = await FactoryEngine.createStock(company.id, part.id, branch.id, 10);
  const supplier = await FactoryEngine.createSupplier(company.id, { name: `${label} supplier` });
  const financial = await FactoryEngine.createFinancialRecord(company.id, branch.id, {
    type: 'RECEIVABLE',
    status: 'PENDING',
    description: `${label} receivable`,
  });
  const serviceOrder = await FactoryEngine.createServiceOrder(company.id, client.id, vehicle.id, branch.id, {
    notes: `${label} service order`,
  });
  const osService = await prismaClient.oSService.create({
    data: { serviceOrderId: serviceOrder.id, name: `${label} service`, price: 100 },
  });
  const osPart = await prismaClient.oSPart.create({
    data: { serviceOrderId: serviceOrder.id, partId: part.id, quantity: 1, unitPrice: 50 },
  });
  await prismaClient.auditLog.create({
    data: { userId: admin.id, action: 'SEED', resource: `${label} audit`, resourceId: client.id },
  });

  return { company, branch, admin, mechanic, client, vehicle, part, stock, supplier, financial, serviceOrder, osService, osPart };
}

/** Serialises every row that belongs to a tenant, to prove a request changed nothing. */
async function snapshot(t: Seed): Promise<string> {
  const tables = await prismaClient.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name FROM information_schema.columns
    WHERE table_schema = 'public' AND column_name = 'companyId'
    ORDER BY table_name`;
  const parts: string[] = [];
  for (const { table_name } of tables) {
    const rows = await prismaClient.$queryRawUnsafe<Array<{ r: string }>>(
      `SELECT row_to_json(t)::text AS r FROM "${table_name}" t WHERE "companyId" = $1 ORDER BY 1`,
      t.company.id,
    );
    parts.push(table_name, ...rows.map((x) => x.r));
  }
  for (const table of ['OSService', 'OSPart']) {
    const rows = await prismaClient.$queryRawUnsafe<Array<{ r: string }>>(
      `SELECT row_to_json(t)::text AS r FROM "${table}" t WHERE "serviceOrderId" = $1 ORDER BY 1`,
      t.serviceOrder.id,
    );
    parts.push(table, ...rows.map((x) => x.r));
  }
  const company = await prismaClient.$queryRawUnsafe<Array<{ r: string }>>(
    `SELECT row_to_json(t)::text AS r FROM "Company" t WHERE id = $1`,
    t.company.id,
  );
  const audit = await prismaClient.$queryRawUnsafe<Array<{ r: string }>>(
    `SELECT row_to_json(t)::text AS r FROM "AuditLog" t WHERE "userId" = $1 AND action = 'SEED'`,
    t.admin.id,
  );
  return [...parts, ...company.map((x) => x.r), ...audit.map((x) => x.r)].join('\n');
}

function secretsOf(t: Seed): string[] {
  return [
    MARKER,
    t.company.id,
    t.branch.id,
    t.admin.id,
    t.mechanic.id,
    t.client.id,
    t.vehicle.id,
    t.part.id,
    t.stock.id,
    t.supplier.id,
    t.financial.id,
    t.serviceOrder.id,
  ];
}

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

interface IsolationCase {
  /** Route key as listed by the router: "METHOD /prefix/path". */
  route: string;
  /** Short description of the attack. */
  title: string;
  url: (b: Seed, a: Seed) => string;
  body?: (b: Seed, a: Seed) => Record<string, unknown>;
  headers?: (b: Seed, a: Seed) => Record<string, string>;
  /**
   * Lists, and writes whose foreign companyId/branchId is ignored in favour of the
   * caller's tenant, may answer 2xx as long as B's data is absent and unchanged.
   * Rejecting those fields outright is covered by the mass-assignment suite.
   */
  allow2xx?: boolean;
  /** Known hole: the test is expected to fail until the fix lands. */
  leaks?: boolean;
}

const CASES: IsolationCase[] = [
  // ── clients ──
  { route: 'GET /api/clients', title: 'list does not include B clients', url: () => '/api/clients', allow2xx: true },
  { route: 'POST /api/clients', title: 'cannot create a client inside B via body companyId', url: () => '/api/clients', body: (b) => ({ name: 'Injected', document: '99988877766', companyId: b.company.id }) , allow2xx: true},
  { route: 'PUT /api/clients/:id', title: 'cannot update a B client', url: (b) => `/api/clients/${b.client.id}`, body: () => ({ name: 'Hijacked' }) },
  { route: 'DELETE /api/clients/:id', title: 'cannot delete a B client', url: (b) => `/api/clients/${b.client.id}` },

  // ── vehicles ──
  { route: 'GET /api/vehicles', title: 'list does not include B vehicles', url: () => '/api/vehicles', allow2xx: true },
  { route: 'POST /api/vehicles', title: 'cannot attach a vehicle to a B client', url: () => '/api/vehicles', body: (b) => ({ clientId: b.client.id, plate: 'XSS1A23', model: 'Gol', brand: 'VW', year: 2020 }) },
  { route: 'PUT /api/vehicles/:id', title: 'cannot update a B vehicle', url: (b) => `/api/vehicles/${b.vehicle.id}`, body: () => ({ model: 'Hijacked' }) },
  { route: 'DELETE /api/vehicles/:id', title: 'cannot delete a B vehicle', url: (b) => `/api/vehicles/${b.vehicle.id}` },

  // ── service orders ──
  { route: 'GET /api/service-orders', title: 'list does not include B service orders', url: () => '/api/service-orders', allow2xx: true },
  { route: 'POST /api/service-orders', title: 'cannot open a service order for a B client/vehicle', url: () => '/api/service-orders', body: (b, a) => ({ clientId: b.client.id, vehicleId: b.vehicle.id, branchId: a.branch.id }) },
  { route: 'GET /api/service-orders/top-services', title: 'top services does not include B data', url: () => '/api/service-orders/top-services', allow2xx: true },
  { route: 'GET /api/service-orders/:id', title: 'cannot read a B service order', url: (b) => `/api/service-orders/${b.serviceOrder.id}` },
  { route: 'GET /api/service-orders/:id/pdf', title: 'cannot print a B service order', url: (b) => `/api/service-orders/${b.serviceOrder.id}/pdf` , leaks: true},
  { route: 'PATCH /api/service-orders/:id/start', title: 'cannot start a B service order', url: (b) => `/api/service-orders/${b.serviceOrder.id}/start` },
  { route: 'PATCH /api/service-orders/:id/cancel', title: 'cannot cancel a B service order', url: (b) => `/api/service-orders/${b.serviceOrder.id}/cancel`, body: () => ({ reason: 'cross-tenant' }) },
  { route: 'PATCH /api/service-orders/:id/status', title: 'cannot change status of a B service order', url: (b) => `/api/service-orders/${b.serviceOrder.id}/status`, body: () => ({ status: 'CANCELED', reason: 'cross-tenant' }) },
  { route: 'PUT /api/service-orders/:id/diagnosis', title: 'cannot write diagnosis on a B service order', url: (b) => `/api/service-orders/${b.serviceOrder.id}/diagnosis`, body: () => ({ diagnosis: 'cross-tenant diagnosis' }) },
  { route: 'POST /api/service-orders/:id/items', title: 'cannot add items to a B service order', url: (b) => `/api/service-orders/${b.serviceOrder.id}/items`, body: () => ({ services: [{ description: 'Injected', price: 1, quantity: 1 }] }) },
  { route: 'DELETE /api/service-orders/:id/items/:itemId', title: 'cannot remove items from a B service order', url: (b) => `/api/service-orders/${b.serviceOrder.id}/items/${b.osService.id}` },
  { route: 'GET /api/service-orders/:id/approval', title: 'cannot read approval of a B service order', url: (b) => `/api/service-orders/${b.serviceOrder.id}/approval` , allow2xx: true},
  { route: 'POST /api/service-orders/:id/approval/request', title: 'cannot request approval on a B service order', url: (b) => `/api/service-orders/${b.serviceOrder.id}/approval/request`, body: () => ({ method: 'ASSISTED' }) },
  { route: 'POST /api/service-orders/:id/approval/approve', title: 'cannot approve a B service order', url: (b) => `/api/service-orders/${b.serviceOrder.id}/approval/approve`, body: () => ({ approvedByName: 'x', method: 'ASSISTED' }) },
  { route: 'POST /api/service-orders/:id/approval/reject', title: 'cannot reject a B service order', url: (b) => `/api/service-orders/${b.serviceOrder.id}/approval/reject`, body: () => ({ reason: 'cross-tenant' }) },
  { route: 'POST /api/service-orders/:id/approval/invalidate', title: 'cannot invalidate approval of a B service order', url: (b) => `/api/service-orders/${b.serviceOrder.id}/approval/invalidate`, body: () => ({ reason: 'cross-tenant' }) },
  { route: 'GET /api/service-orders/:serviceOrderId/completion/readiness', title: 'cannot read completion readiness of a B service order', url: (b) => `/api/service-orders/${b.serviceOrder.id}/completion/readiness` },
  { route: 'POST /api/service-orders/:serviceOrderId/complete', title: 'cannot complete a B service order', url: (b) => `/api/service-orders/${b.serviceOrder.id}/complete` },
  { route: 'PATCH /api/service-orders/:serviceOrderId/complete', title: 'cannot complete a B service order (deprecated alias)', url: (b) => `/api/service-orders/${b.serviceOrder.id}/complete` },
  { route: 'GET /api/service-orders/:serviceOrderId/finance', title: 'cannot read finance of a B service order', url: (b) => `/api/service-orders/${b.serviceOrder.id}/finance` },
  { route: 'POST /api/service-orders/:serviceOrderId/finance/receivable', title: 'cannot generate a receivable for a B service order', url: (b) => `/api/service-orders/${b.serviceOrder.id}/finance/receivable`, body: () => ({ dueDate: '2099-12-31' }) },
  { route: 'GET /api/service-orders/:serviceOrderId/execution', title: 'cannot read execution of a B service order', url: (b) => `/api/service-orders/${b.serviceOrder.id}/execution` },
  { route: 'POST /api/service-orders/:serviceOrderId/services/:serviceId/assign', title: 'cannot assign a mechanic on a B service', url: (b) => `/api/service-orders/${b.serviceOrder.id}/services/${b.osService.id}/assign`, body: (b, a) => ({ mechanicId: a.mechanic.id }) },
  { route: 'POST /api/service-orders/:serviceOrderId/services/:serviceId/start', title: 'cannot start a B service', url: (b) => `/api/service-orders/${b.serviceOrder.id}/services/${b.osService.id}/start` },
  { route: 'POST /api/service-orders/:serviceOrderId/services/:serviceId/pause', title: 'cannot pause a B service', url: (b) => `/api/service-orders/${b.serviceOrder.id}/services/${b.osService.id}/pause` },
  { route: 'POST /api/service-orders/:serviceOrderId/services/:serviceId/resume', title: 'cannot resume a B service', url: (b) => `/api/service-orders/${b.serviceOrder.id}/services/${b.osService.id}/resume` },
  { route: 'POST /api/service-orders/:serviceOrderId/services/:serviceId/complete', title: 'cannot complete a B service', url: (b) => `/api/service-orders/${b.serviceOrder.id}/services/${b.osService.id}/complete` },
  { route: 'GET /api/service-orders/:serviceOrderId/parts/consumption', title: 'cannot read part consumption of a B service order', url: (b) => `/api/service-orders/${b.serviceOrder.id}/parts/consumption` },
  { route: 'POST /api/service-orders/:serviceOrderId/parts/:partId/consume', title: 'cannot consume B stock through a B service order', url: (b) => `/api/service-orders/${b.serviceOrder.id}/parts/${b.part.id}/consume`, body: () => ({ quantity: 1 }) },

  // ── stock ──
  { route: 'GET /api/stock', title: 'stock root does not expose B data', url: () => '/api/stock', allow2xx: true },
  { route: 'POST /api/stock/entry', title: 'cannot add stock to a B part/branch', url: () => '/api/stock/entry', body: (b) => ({ partId: b.part.id, branchId: b.branch.id, quantity: 5, unitCost: 1 }) , leaks: true},
  { route: 'POST /api/stock/parts', title: 'cannot create a part inside B via body companyId', url: () => '/api/stock/parts', body: (b) => ({ name: 'Injected part', internalCode: 'INJ-0001', companyId: b.company.id, salePrice: 1, purchasePrice: 1 }) , allow2xx: true},
  { route: 'POST /api/stock/transfer', title: 'cannot transfer B stock', url: () => '/api/stock/transfer', body: (b, a) => ({ partId: b.part.id, fromBranchId: b.branch.id, toBranchId: a.branch.id, quantity: 1 }) , leaks: true},
  { route: 'GET /api/stock/dashboard', title: 'stock dashboard does not include B data', url: () => '/api/stock/dashboard', allow2xx: true },
  { route: 'GET /api/stock/low-stock', title: 'low stock does not include B parts', url: () => '/api/stock/low-stock', allow2xx: true },
  { route: 'GET /api/stock/parts', title: 'part search does not include B parts', url: () => `/api/stock/parts?q=${MARKER}`, allow2xx: true },
  { route: 'GET /api/stock/top-parts', title: 'top parts does not include B parts', url: () => '/api/stock/top-parts', allow2xx: true },
  { route: 'GET /api/stock/parts', title: 'x-branch-id pointing at a B branch is not trusted', url: () => '/api/stock/parts?q=part', headers: (b) => ({ 'x-branch-id': b.branch.id }), allow2xx: true },

  // ── suppliers ──
  { route: 'GET /api/suppliers', title: 'list does not include B suppliers', url: () => '/api/suppliers', allow2xx: true },
  { route: 'POST /api/suppliers', title: 'cannot create a supplier inside B via body companyId', url: () => '/api/suppliers', body: (b) => ({ name: 'Injected supplier', cnpj: '12.345.678/0001-90', companyId: b.company.id }) , allow2xx: true},
  { route: 'PUT /api/suppliers/:id', title: 'cannot update a B supplier', url: (b) => `/api/suppliers/${b.supplier.id}`, body: () => ({ name: 'Hijacked' }) },

  // ── financial ──
  { route: 'GET /api/financial', title: 'list does not include B records', url: () => '/api/financial', allow2xx: true },
  { route: 'POST /api/financial', title: 'cannot create a record on a B branch', url: () => '/api/financial', body: (b) => ({ type: 'PAYABLE', category: 'Rent', description: 'Injected', amount: 10, dueDate: '2099-12-31', branchId: b.branch.id, companyId: b.company.id }) , allow2xx: true},
  { route: 'PUT /api/financial/:id', title: 'cannot update a B record', url: (b) => `/api/financial/${b.financial.id}`, body: () => ({ description: 'Hijacked', amount: 1 }) },
  { route: 'DELETE /api/financial/:id', title: 'cannot delete a B record', url: (b) => `/api/financial/${b.financial.id}` },
  { route: 'GET /api/financial/invoices', title: 'invoice list does not include B records', url: () => '/api/financial/invoices', allow2xx: true },
  { route: 'POST /api/financial/invoices', title: 'cannot create an invoice on a B branch', url: () => '/api/financial/invoices', body: (b) => ({ type: 'RECEIVABLE', category: 'Rent', description: 'Injected', amount: 10, dueDate: '2099-12-31', branchId: b.branch.id, companyId: b.company.id }) , allow2xx: true},
  { route: 'PUT /api/financial/invoices/:id', title: 'cannot update a B invoice', url: (b) => `/api/financial/invoices/${b.financial.id}`, body: () => ({ description: 'Hijacked', amount: 1 }) },
  { route: 'DELETE /api/financial/invoices/:id', title: 'cannot delete a B invoice', url: (b) => `/api/financial/invoices/${b.financial.id}` },
  { route: 'GET /api/financial/invoices/:id', title: 'cannot read a B invoice', url: (b) => `/api/financial/invoices/${b.financial.id}` },
  { route: 'PATCH /api/financial/invoices/:id/status', title: 'cannot change status of a B invoice', url: (b) => `/api/financial/invoices/${b.financial.id}/status`, body: () => ({ status: 'PAID' }) },
  { route: 'POST /api/financial/invoices/:id/payments', title: 'cannot register a payment on a B invoice', url: (b) => `/api/financial/invoices/${b.financial.id}/payments`, body: () => ({ amount: 1, method: 'PIX' }) },
  { route: 'GET /api/financial/invoices/:id/pdf', title: 'cannot print a B invoice', url: (b) => `/api/financial/invoices/${b.financial.id}/pdf` },

  // ── users ──
  { route: 'GET /api/users', title: 'list does not include B users', url: () => '/api/users', allow2xx: true },
  { route: 'POST /api/users', title: 'cannot create a user inside B via body companyId', url: () => '/api/users', body: (b) => ({ name: 'Injected', email: 'injected-user@example.com', password: 'Password123!', role: 'ADMIN', companyId: b.company.id, branchId: b.branch.id }) },
  { route: 'PUT /api/users/:id', title: 'cannot update a B user', url: (b) => `/api/users/${b.admin.id}`, body: () => ({ name: 'Hijacked', password: 'Password123!' }) },
  { route: 'DELETE /api/users/:id', title: 'cannot delete a B user', url: (b) => `/api/users/${b.mechanic.id}` },

  // ── companies (plan 0.1: tenant API only sees its own company) ──
  { route: 'GET /api/companies', title: 'company list does not include B', url: () => '/api/companies', allow2xx: true, leaks: true },
  { route: 'POST /api/companies', title: 'tenant users cannot create companies', url: () => '/api/companies', body: () => ({ name: `${MARKER} new`, document: '11.222.333/0001-44' }), leaks: true },
  { route: 'PUT /api/companies/:id', title: 'cannot update company B', url: (b) => `/api/companies/${b.company.id}`, body: () => ({ name: 'Hijacked' }), leaks: true },
  { route: 'DELETE /api/companies/:id', title: 'cannot delete company B', url: (b) => `/api/companies/${b.company.id}` },

  // ── branches ──
  { route: 'GET /api/branches', title: 'list does not include B branches', url: () => '/api/branches', allow2xx: true },
  { route: 'POST /api/branches', title: 'cannot create a branch inside B via body companyId', url: () => '/api/branches', body: (b) => ({ name: 'Injected branch', cnpj: '55.666.777/0001-88', companyId: b.company.id }) , allow2xx: true},
  { route: 'PUT /api/branches/:id', title: 'cannot update a B branch', url: (b) => `/api/branches/${b.branch.id}`, body: () => ({ name: 'Hijacked' }) },

  // ── dashboard ──
  ...dashboardCases(),

  // ── audit (plan 0.3: AuditLog has no companyId yet) ──
  { route: 'GET /api/audit', title: 'audit log does not include B entries', url: () => '/api/audit', allow2xx: true, leaks: true },
];

function dashboardCases(): IsolationCase[] {
  return listRoutes(app, MOUNTS)
    .filter((r) => r.startsWith('GET /api/dashboard'))
    .map((route) => ({
      route,
      title: 'dashboard does not include B data',
      url: () => route.slice('GET '.length),
      allow2xx: true,
    }));
}

function send(method: Method, url: string, headers: Record<string, string>, body?: Record<string, unknown>) {
  const req = request(app)[method](url).set(headers);
  return body ? req.send(body) : req;
}

describe('Tenant isolation: company A cannot reach company B', () => {
  let a: Seed;
  let b: Seed;

  beforeEach(async () => {
    a = await seedTenant('TENANT_A');
    b = await seedTenant(MARKER);
  });

  it('every tenant route has an isolation case', () => {
    const covered = new Set(CASES.map((c) => c.route));
    const missing = listRoutes(app, MOUNTS).filter((r) => !PUBLIC_ROUTES.has(r) && !covered.has(r));
    expect(missing).toEqual([]);
  });

  it('every isolation case targets a real route', () => {
    const routes = new Set(listRoutes(app, MOUNTS));
    expect(CASES.map((c) => c.route).filter((r) => !routes.has(r))).toEqual([]);
  });

  for (const c of CASES) {
    const run = c.leaks ? it.fails : it;
    run(`${c.route}: ${c.title}`, async () => {
      const before = await snapshot(b);
      const [method] = c.route.split(' ');
      const res = await send(
        method.toLowerCase() as Method,
        c.url(b, a),
        { ...generateAuthHeaders(a.admin), ...(c.headers?.(b, a) ?? {}) },
        c.body?.(b, a),
      );

      const payload = Buffer.isBuffer(res.body) ? res.body.toString('latin1') : (res.text ?? JSON.stringify(res.body));
      const leaked = secretsOf(b).filter((s) => payload.includes(s));
      expect(leaked, `response leaks B data (status ${res.status})`).toEqual([]);
      if (!c.allow2xx) {
        expect(res.status, `expected a 4xx, body: ${payload.slice(0, 300)}`).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(500);
      }
      expect(await snapshot(b), 'B data changed').toBe(before);
    });
  }
});
