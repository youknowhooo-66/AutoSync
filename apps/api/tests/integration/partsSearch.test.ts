/**
 * Integration tests for GET /api/inventory/parts (SearchPartsService)
 *
 * Each test creates its own fixtures because the global afterEach in setup.ts
 * truncates all tables after every individual test.
 *
 * Covers:
 * - Listing without search term (returns all active parts for the company)
 * - Searching by exact code (internalCode, manufacturerCode, barcode)
 * - Searching by name prefix
 * - Availability filters (ALL, AVAILABLE, OUT_OF_STOCK)
 * - Sort by NAME, SKU, AVAILABLE_QUANTITY
 * - Pagination (page, pageSize, totalPages)
 * - Multi-tenant isolation (company A cannot see company B parts)
 * - Branch-scoped stock quantities
 * - Invalid query parameter validation
 * - Response DTO contract
 */

import request from 'supertest';
import app from '../../src/app';
import { FactoryEngine } from '../factories/FactoryEngine';
import { generateAuthHeaders } from '../helpers/auth';
import { prismaClient } from '../../src/shared/database/prismaClient';

// ── Helper: create a minimal test scenario ────────────────────────────────────
async function setupBasicScenario() {
  const company = await FactoryEngine.createCompany();
  const branch = await FactoryEngine.createBranch(company.id);
  const user = await FactoryEngine.createUser(company.id, {
    role: 'ADMIN',
    branchId: branch.id,
  });
  const headers = generateAuthHeaders(user);
  return { company, branch, user, headers };
}

async function createPartWithStock(
  companyId: string,
  branchId: string,
  partOverrides: Record<string, any> = {},
  stockQuantity = '10.000',
  stockReserved = '0.000',
) {
  const part = await FactoryEngine.createPart(companyId, partOverrides);
  const stock = await prismaClient.stock.create({
    data: {
      companyId,
      branchId,
      partId: part.id,
      quantity: stockQuantity,
      reservedQuantity: stockReserved,
    },
  });
  return { part, stock };
}

// ── Section 1: Basic listing ───────────────────────────────────────────────────
describe('GET /api/inventory/parts — Listing without search term', () => {
  it('should return paginated parts for the authenticated company', async () => {
    const { company, branch, headers } = await setupBasicScenario();
    await FactoryEngine.createPart(company.id, { name: 'Filtro Óleo', internalCode: 'F001' });
    await FactoryEngine.createPart(company.id, { name: 'Amortecedor', internalCode: 'A001' });

    const response = await request(app)
      .get('/api/inventory/parts')
      .set(headers)
      .query({ branchId: branch.id });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('items');
    expect(response.body.data).toHaveProperty('total');
    expect(response.body.data).toHaveProperty('page');
    expect(response.body.data).toHaveProperty('pageSize');
    expect(response.body.data).toHaveProperty('totalPages');
    expect(Array.isArray(response.body.data.items)).toBe(true);
    expect(response.body.data.items.length).toBeGreaterThanOrEqual(2);
  });

  it('should return stock quantities as decimal strings', async () => {
    const { company, branch, headers } = await setupBasicScenario();
    const { part } = await createPartWithStock(
      company.id, branch.id,
      { name: 'Filtro de Óleo', internalCode: 'FLT-001' },
      '10.000', '2.000'
    );

    const response = await request(app)
      .get('/api/inventory/parts')
      .set(headers)
      .query({ branchId: branch.id });

    expect(response.status).toBe(200);
    const item = response.body.data.items.find((i: any) => i.id === part.id);
    expect(item).toBeDefined();
    expect(item.onHandQuantity).toBe('10.000');
    expect(item.reservedQuantity).toBe('2.000');
    expect(item.availableQuantity).toBe('8.000');
    expect(item.canSelectFromStock).toBe(true);
  });

  it('should mark parts with zero available quantity as not selectable', async () => {
    const { company, branch, headers } = await setupBasicScenario();
    const part = await FactoryEngine.createPart(company.id, {
      name: 'Amortecedor Sem Saldo',
      internalCode: 'AMO-002',
    });
    // No stock record → quantity defaults to 0

    const response = await request(app)
      .get('/api/inventory/parts')
      .set(headers)
      .query({ branchId: branch.id });

    expect(response.status).toBe(200);
    const item = response.body.data.items.find((i: any) => i.id === part.id);
    expect(item).toBeDefined();
    expect(item.canSelectFromStock).toBe(false);
    expect(item.onHandQuantity).toBe('0.000');
  });
});

// ── Section 2: Search term matching ───────────────────────────────────────────
describe('GET /api/inventory/parts — Search term matching', () => {
  it('should find part by exact internalCode match (highest relevance)', async () => {
    const { company, branch, headers } = await setupBasicScenario();
    const { part } = await createPartWithStock(
      company.id, branch.id,
      { name: 'Filtro de Óleo Wega', internalCode: 'FLT-001', barcode: null },
    );

    const response = await request(app)
      .get('/api/inventory/parts')
      .set(headers)
      .query({ q: 'FLT-001', branchId: branch.id });

    expect(response.status).toBe(200);
    expect(response.body.data.items.length).toBeGreaterThanOrEqual(1);
    const first = response.body.data.items[0];
    expect(first.id).toBe(part.id);
    expect(first.sku).toBe('FLT-001');
  });

  it('should find part by exact manufacturerCode match', async () => {
    const { company, branch, headers } = await setupBasicScenario();
    const { part } = await createPartWithStock(
      company.id, branch.id,
      { name: 'Vela de Ignição NGK', internalCode: 'VEL-001', manufacturerCode: 'MFGEXACT001' },
    );

    const response = await request(app)
      .get('/api/inventory/parts')
      .set(headers)
      .query({ q: 'MFGEXACT001', branchId: branch.id });

    expect(response.status).toBe(200);
    expect(response.body.data.items.length).toBeGreaterThanOrEqual(1);
    expect(response.body.data.items[0].id).toBe(part.id);
  });

  it('should find part by exact barcode match', async () => {
    const { company, branch, headers } = await setupBasicScenario();
    const { part } = await createPartWithStock(
      company.id, branch.id,
      { name: 'Filtro Barcode', internalCode: 'FLT-BC1', barcode: '7891234567890' },
    );

    const response = await request(app)
      .get('/api/inventory/parts')
      .set(headers)
      .query({ q: '7891234567890', branchId: branch.id });

    expect(response.status).toBe(200);
    expect(response.body.data.items.length).toBeGreaterThanOrEqual(1);
    expect(response.body.data.items[0].id).toBe(part.id);
  });

  it('should find parts by name prefix', async () => {
    const { company, branch, headers } = await setupBasicScenario();
    const { part } = await createPartWithStock(
      company.id, branch.id,
      { name: 'Filtro de Ar Mann', internalCode: 'FAR-001' },
    );

    const response = await request(app)
      .get('/api/inventory/parts')
      .set(headers)
      .query({ q: 'Filtro', branchId: branch.id });

    expect(response.status).toBe(200);
    const ids = response.body.data.items.map((i: any) => i.id);
    expect(ids).toContain(part.id);
  });

  it('should enforce minimum 2-character search term', async () => {
    const { headers } = await setupBasicScenario();

    const response = await request(app)
      .get('/api/inventory/parts')
      .set(headers)
      .query({ q: 'F' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('should treat empty q as no search term (listing mode)', async () => {
    const { company, branch, headers } = await setupBasicScenario();
    await FactoryEngine.createPart(company.id, { name: 'Peça Teste', internalCode: 'PT-001' });
    await FactoryEngine.createPart(company.id, { name: 'Outra Peça', internalCode: 'OP-001' });

    const response = await request(app)
      .get('/api/inventory/parts')
      .set(headers)
      .query({ q: '', branchId: branch.id });

    expect(response.status).toBe(200);
    expect(response.body.data.items.length).toBeGreaterThanOrEqual(2);
  });
});

// ── Section 3: Availability filters ──────────────────────────────────────────
describe('GET /api/inventory/parts — Availability filters', () => {
  it('should return only parts with available stock when availability=AVAILABLE', async () => {
    const { company, branch, headers } = await setupBasicScenario();

    const { part: inStockPart } = await createPartWithStock(
      company.id, branch.id,
      { name: 'Peça Com Saldo', internalCode: 'CS-001' },
      '10.000', '2.000'
    );

    const noStockPart = await FactoryEngine.createPart(company.id, {
      name: 'Peça Sem Saldo',
      internalCode: 'SS-001',
    });

    const response = await request(app)
      .get('/api/inventory/parts')
      .set(headers)
      .query({ availability: 'AVAILABLE', branchId: branch.id });

    expect(response.status).toBe(200);
    const items = response.body.data.items;
    items.forEach((item: any) => {
      expect(item.canSelectFromStock).toBe(true);
      expect(parseFloat(item.availableQuantity)).toBeGreaterThan(0);
    });
    expect(items.some((i: any) => i.id === inStockPart.id)).toBe(true);
    expect(items.some((i: any) => i.id === noStockPart.id)).toBe(false);
  });

  it('should return only out-of-stock parts when availability=OUT_OF_STOCK', async () => {
    const { company, branch, headers } = await setupBasicScenario();

    await createPartWithStock(
      company.id, branch.id,
      { name: 'Peça Com Saldo', internalCode: 'CS-002' },
      '5.000', '0.000'
    );

    const noStockPart = await FactoryEngine.createPart(company.id, {
      name: 'Peça Sem Saldo',
      internalCode: 'SS-002',
    });

    const response = await request(app)
      .get('/api/inventory/parts')
      .set(headers)
      .query({ availability: 'OUT_OF_STOCK', branchId: branch.id });

    expect(response.status).toBe(200);
    const items = response.body.data.items;
    items.forEach((item: any) => {
      expect(item.canSelectFromStock).toBe(false);
    });
    expect(items.some((i: any) => i.id === noStockPart.id)).toBe(true);
  });

  it('should return all parts when availability=ALL', async () => {
    const { company, branch, headers } = await setupBasicScenario();

    const { part: inStockPart } = await createPartWithStock(
      company.id, branch.id,
      { name: 'Com Saldo', internalCode: 'CS-003' },
      '5.000', '0.000'
    );

    const noStockPart = await FactoryEngine.createPart(company.id, {
      name: 'Sem Saldo',
      internalCode: 'SS-003',
    });

    const response = await request(app)
      .get('/api/inventory/parts')
      .set(headers)
      .query({ availability: 'ALL', branchId: branch.id });

    expect(response.status).toBe(200);
    const ids = response.body.data.items.map((i: any) => i.id);
    expect(ids).toContain(inStockPart.id);
    expect(ids).toContain(noStockPart.id);
  });
});

// ── Section 4: Sorting ────────────────────────────────────────────────────────
describe('GET /api/inventory/parts — Sorting', () => {
  it('should sort by NAME ascending', async () => {
    const { company, branch, headers } = await setupBasicScenario();
    await FactoryEngine.createPart(company.id, { name: 'Zebra Part', internalCode: 'ZP-001' });
    await FactoryEngine.createPart(company.id, { name: 'Alpha Part', internalCode: 'AP-001' });
    await FactoryEngine.createPart(company.id, { name: 'Middle Part', internalCode: 'MP-001' });

    const response = await request(app)
      .get('/api/inventory/parts')
      .set(headers)
      .query({ sortBy: 'NAME', sortOrder: 'asc', branchId: branch.id });

    expect(response.status).toBe(200);
    const names = response.body.data.items.map((i: any) => i.name.toLowerCase());
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });

  it('should sort by SKU ascending', async () => {
    const { company, branch, headers } = await setupBasicScenario();
    await FactoryEngine.createPart(company.id, { name: 'Part Z', internalCode: 'ZZZ-001' });
    await FactoryEngine.createPart(company.id, { name: 'Part A', internalCode: 'AAA-001' });

    const response = await request(app)
      .get('/api/inventory/parts')
      .set(headers)
      .query({ sortBy: 'SKU', sortOrder: 'asc', branchId: branch.id });

    expect(response.status).toBe(200);
    const skus = response.body.data.items.map((i: any) => (i.sku ?? '').toLowerCase());
    const sorted = [...skus].sort((a, b) => a.localeCompare(b));
    expect(skus).toEqual(sorted);
  });

  it('should sort by AVAILABLE_QUANTITY descending', async () => {
    const { company, branch, headers } = await setupBasicScenario();
    await createPartWithStock(company.id, branch.id, { name: 'Low Stock', internalCode: 'LS-001' }, '2.000');
    await createPartWithStock(company.id, branch.id, { name: 'High Stock', internalCode: 'HS-001' }, '50.000');
    await createPartWithStock(company.id, branch.id, { name: 'Mid Stock', internalCode: 'MS-001' }, '20.000');

    const response = await request(app)
      .get('/api/inventory/parts')
      .set(headers)
      .query({ sortBy: 'AVAILABLE_QUANTITY', sortOrder: 'desc', branchId: branch.id });

    expect(response.status).toBe(200);
    const quantities = response.body.data.items.map((i: any) => parseFloat(i.availableQuantity));
    for (let idx = 1; idx < quantities.length; idx++) {
      expect(quantities[idx - 1]).toBeGreaterThanOrEqual(quantities[idx]);
    }
  });

  it('should sort by RELEVANCE with exact code match first', async () => {
    const { company, branch, headers } = await setupBasicScenario();
    const { part: exactPart } = await createPartWithStock(
      company.id, branch.id,
      { name: 'Vela NGK Exata', internalCode: 'VEL-EXATO' },
    );
    // Another part that matches partially
    await FactoryEngine.createPart(company.id, { name: 'Vela Champion', internalCode: 'VEL-002' });

    const response = await request(app)
      .get('/api/inventory/parts')
      .set(headers)
      .query({ q: 'VEL-EXATO', sortBy: 'RELEVANCE', branchId: branch.id });

    expect(response.status).toBe(200);
    expect(response.body.data.items[0].id).toBe(exactPart.id);
  });
});

// ── Section 5: Pagination ──────────────────────────────────────────────────────
describe('GET /api/inventory/parts — Pagination', () => {
  it('should respect pageSize and return correct totalPages', async () => {
    const { company, branch, headers } = await setupBasicScenario();
    // Create 5 parts
    for (let i = 1; i <= 5; i++) {
      await FactoryEngine.createPart(company.id, { name: `Part ${i}`, internalCode: `PT-00${i}` });
    }

    const response = await request(app)
      .get('/api/inventory/parts')
      .set(headers)
      .query({ pageSize: 2, page: 1, branchId: branch.id });

    expect(response.status).toBe(200);
    expect(response.body.data.items.length).toBe(2);
    expect(response.body.data.totalPages).toBeGreaterThanOrEqual(3);
    expect(response.body.data.page).toBe(1);
    expect(response.body.data.pageSize).toBe(2);
  });

  it('should return different items on page 2', async () => {
    const { company, branch, headers } = await setupBasicScenario();
    for (let i = 1; i <= 4; i++) {
      await FactoryEngine.createPart(company.id, { name: `Part ${i}`, internalCode: `PT-10${i}` });
    }

    const page1 = await request(app)
      .get('/api/inventory/parts')
      .set(headers)
      .query({ pageSize: 2, page: 1, sortBy: 'NAME', sortOrder: 'asc', branchId: branch.id });

    const page2 = await request(app)
      .get('/api/inventory/parts')
      .set(headers)
      .query({ pageSize: 2, page: 2, sortBy: 'NAME', sortOrder: 'asc', branchId: branch.id });

    expect(page1.status).toBe(200);
    expect(page2.status).toBe(200);
    expect(page1.body.data.items[0].id).not.toBe(page2.body.data.items[0].id);
  });
});

// ── Section 6: Multi-tenant isolation ─────────────────────────────────────────
describe('GET /api/inventory/parts — Multi-tenant isolation', () => {
  it('should not return parts from another company', async () => {
    const { company: companyA, branch: branchA, headers: headersA } = await setupBasicScenario();
    const { company: companyB, branch: branchB, headers: headersB } = await setupBasicScenario();

    const partA = await FactoryEngine.createPart(companyA.id, {
      name: 'Peça Empresa A',
      internalCode: 'ISO-A01',
    });
    const partB = await FactoryEngine.createPart(companyB.id, {
      name: 'Peça Empresa B',
      internalCode: 'ISO-B01',
    });

    // Company A should not see company B's part
    const responseA = await request(app)
      .get('/api/inventory/parts')
      .set(headersA)
      .query({ branchId: branchA.id });

    const idsA = responseA.body.data.items.map((i: any) => i.id);
    expect(idsA).toContain(partA.id);
    expect(idsA).not.toContain(partB.id);

    // Company B should not see company A's part
    const responseB = await request(app)
      .get('/api/inventory/parts')
      .set(headersB)
      .query({ branchId: branchB.id });

    const idsB = responseB.body.data.items.map((i: any) => i.id);
    expect(idsB).toContain(partB.id);
    expect(idsB).not.toContain(partA.id);
  });
});

// ── Section 7: Validation ──────────────────────────────────────────────────────
describe('GET /api/inventory/parts — Query parameter validation', () => {
  it('should return 400 for invalid availability value', async () => {
    const { headers } = await setupBasicScenario();

    const response = await request(app)
      .get('/api/inventory/parts')
      .set(headers)
      .query({ availability: 'INVALID' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('should return 400 for invalid sortBy value', async () => {
    const { headers } = await setupBasicScenario();

    const response = await request(app)
      .get('/api/inventory/parts')
      .set(headers)
      .query({ sortBy: 'PRICE' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('should return 400 for non-UUID branchId', async () => {
    const { headers } = await setupBasicScenario();

    const response = await request(app)
      .get('/api/inventory/parts')
      .set(headers)
      .query({ branchId: 'not-a-uuid' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('should use default pagination when page/pageSize are omitted', async () => {
    const { headers } = await setupBasicScenario();

    const response = await request(app)
      .get('/api/inventory/parts')
      .set(headers);

    expect(response.status).toBe(200);
    expect(response.body.data.page).toBe(1);
    expect(response.body.data.pageSize).toBe(10);
  });
});

// ── Section 8: DTO contract ────────────────────────────────────────────────────
describe('GET /api/inventory/parts — Response DTO contract', () => {
  it('should map internalCode to sku in the response', async () => {
    const { company, branch, headers } = await setupBasicScenario();
    await createPartWithStock(
      company.id, branch.id,
      { name: 'Filtro Óleo Wega', internalCode: 'FLT-001', barcode: null },
    );

    const response = await request(app)
      .get('/api/inventory/parts')
      .set(headers)
      .query({ q: 'FLT-001', branchId: branch.id });

    expect(response.status).toBe(200);
    const item = response.body.data.items[0];
    expect(item).toHaveProperty('sku');
    expect(item).not.toHaveProperty('internalCode');
    expect(item.sku).toBe('FLT-001');
  });

  it('should include all required fields in each item', async () => {
    const { company, branch, headers } = await setupBasicScenario();
    await FactoryEngine.createPart(company.id, { name: 'Peça Completa', internalCode: 'PC-001' });

    const response = await request(app)
      .get('/api/inventory/parts')
      .set(headers)
      .query({ branchId: branch.id });

    expect(response.status).toBe(200);
    const item = response.body.data.items[0];
    const requiredFields = [
      'id', 'name', 'sku', 'manufacturerCode', 'barcode', 'brand',
      'description', 'category', 'onHandQuantity', 'reservedQuantity',
      'availableQuantity', 'location', 'averageCost', 'canSelectFromStock', 'active',
    ];
    requiredFields.forEach((field) => {
      expect(item).toHaveProperty(field);
    });
  });

  it('should serialize Decimal quantities as strings', async () => {
    const { company, branch, headers } = await setupBasicScenario();
    await createPartWithStock(
      company.id, branch.id,
      { name: 'Decimal Test', internalCode: 'DEC-001' },
      '5.500', '1.250'
    );

    const response = await request(app)
      .get('/api/inventory/parts')
      .set(headers)
      .query({ q: 'DEC-001', branchId: branch.id });

    expect(response.status).toBe(200);
    const item = response.body.data.items[0];
    expect(typeof item.onHandQuantity).toBe('string');
    expect(typeof item.reservedQuantity).toBe('string');
    expect(typeof item.availableQuantity).toBe('string');
    // Verify correct decimal arithmetic
    expect(item.onHandQuantity).toBe('5.500');
    expect(item.reservedQuantity).toBe('1.250');
    expect(item.availableQuantity).toBe('4.250');
  });
});
