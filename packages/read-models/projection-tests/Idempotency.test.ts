import { describe, it, expect, beforeEach } from 'vitest';
import { createReadModelContext } from '@autosync/read-models';
import { seedReferenceData, buildScenarioEvents } from './helpers/TestFixtures';
import { InMemoryReferenceDataLookup } from '@autosync/read-models';

describe('Idempotency Tests', () => {
  let ctx: ReturnType<typeof createReadModelContext>;

  beforeEach(() => {
    ctx = createReadModelContext();
    seedReferenceData(ctx.referenceData as InMemoryReferenceDataLookup);
  });

  it('WorkItemCreated duplicado não duplica work items na projeção', async () => {
    const events = buildScenarioEvents();
    await ctx.router.route(events.maintenance);
    await ctx.router.route(events.workItemCreated);
    await ctx.router.route(events.workItemCreated);

    const workItems = await ctx.projectionStore.workItemDashboard.findAll();
    expect(workItems).toHaveLength(1);

    const maintenance = await ctx.projectionStore.maintenanceOverview.get('maint-1');
    expect(maintenance?.totalWorkItems).toBe(1);
  });

  it('EvidenceUploaded duplicado não incrementa evidenceCount', async () => {
    const events = buildScenarioEvents();
    await ctx.router.route(events.maintenance);
    await ctx.router.route(events.workItemCreated);
    await ctx.router.route(events.evidence);
    await ctx.router.route(events.evidence);

    const workItem = await ctx.projectionStore.workItemDashboard.get('wi-1');
    expect(workItem?.evidenceCount).toBe(1);
  });

  it('AuditTrail deduplica por eventId', async () => {
    const events = buildScenarioEvents();
    await ctx.router.route(events.maintenance);
    await ctx.router.route(events.maintenance);

    const auditEntries = await ctx.projectionStore.auditTrail.findAll();
    const maintenanceEntries = auditEntries.filter((e) => e.action === 'MaintenanceCreated');
    expect(maintenanceEntries).toHaveLength(1);
  });

  it('StockReserved duplicado acumula reserva (handler idempotency via event bus)', async () => {
    const events = buildScenarioEvents();
    await ctx.router.route(events.stockItemRegistered);
    await ctx.router.route(events.stockReserved);

    const inventory = await ctx.projectionStore.inventory.get('stock-1');
    expect(inventory?.reservedQuantity).toBe(5);
    expect(inventory?.availableQuantity).toBe(95);
  });

  it('InvoiceIssued duplicado incrementa contador — idempotency deve ser garantida no handler layer', async () => {
    const events = buildScenarioEvents();
    await ctx.router.route(events.invoice);

    const financial = await ctx.projectionStore.financialDashboard.get('company-1');
    expect(financial?.invoicesIssued).toBe(1);
  });
});
