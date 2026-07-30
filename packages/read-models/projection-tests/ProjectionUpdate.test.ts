import { describe, it, expect, beforeEach } from 'vitest';
import { createReadModelContext } from '@autosync/read-models';
import { seedReferenceData, buildScenarioEvents } from './helpers/TestFixtures';
import { InMemoryReferenceDataLookup } from '@autosync/read-models';

describe('Projection Update Tests', () => {
  let ctx: ReturnType<typeof createReadModelContext>;

  beforeEach(() => {
    ctx = createReadModelContext();
    seedReferenceData(ctx.referenceData as InMemoryReferenceDataLookup);
  });

  it('WorkItemCreated atualiza WorkItemDashboardView e MaintenanceOverviewView', async () => {
    const events = buildScenarioEvents();

    await ctx.router.route(events.maintenance);
    await ctx.router.route(events.workItemCreated);

    const workItem = await ctx.projectionStore.workItemDashboard.get('wi-1');
    expect(workItem).toMatchObject({
      workItemId: 'wi-1',
      maintenanceId: 'maint-1',
      description: 'Troca de óleo',
      status: 'PENDING',
      estimatedCost: 500,
      vehiclePlate: 'ABC-1234',
      clientName: 'Cliente Teste',
    });

    const maintenance = await ctx.projectionStore.maintenanceOverview.get('maint-1');
    expect(maintenance).toMatchObject({
      totalWorkItems: 1,
      pendingWorkItems: 1,
      estimatedValue: 500,
    });
  });

  it('WorkItemApproved atualiza status para APPROVED', async () => {
    const events = buildScenarioEvents();
    await ctx.router.route(events.maintenance);
    await ctx.router.route(events.workItemCreated);
    await ctx.router.route(events.workItemApproved);

    const workItem = await ctx.projectionStore.workItemDashboard.get('wi-1');
    expect(workItem?.status).toBe('APPROVED');

    const maintenance = await ctx.projectionStore.maintenanceOverview.get('maint-1');
    expect(maintenance?.approvedWorkItems).toBe(1);
    expect(maintenance?.pendingWorkItems).toBe(0);
  });

  it('TechnicalAssignmentCreated atribui técnico ao work item', async () => {
    const events = buildScenarioEvents();
    await ctx.router.route(events.maintenance);
    await ctx.router.route(events.workItemCreated);
    await ctx.router.route(events.technicianAssigned);

    const workItem = await ctx.projectionStore.workItemDashboard.get('wi-1');
    expect(workItem?.assignedTechnicianId).toBe('tech-1');
    expect(workItem?.assignedTechnicianName).toBe('João Mecânico');
  });

  it('TimeEntryRegistered inicia execução e acumula horas do técnico', async () => {
    const events = buildScenarioEvents();
    await ctx.router.route(events.maintenance);
    await ctx.router.route(events.workItemCreated);
    await ctx.router.route(events.technicianAssigned);
    await ctx.router.route(events.timeEntry);

    const workItem = await ctx.projectionStore.workItemDashboard.get('wi-1');
    expect(workItem?.status).toBe('IN_PROGRESS');
    expect(workItem?.startedAt).not.toBeNull();

    const productivity = await ctx.projectionStore.technicianProductivity.get('tech-1');
    expect(productivity?.totalHoursWorked).toBe(2);
  });

  it('EvidenceUploaded incrementa evidenceCount', async () => {
    const events = buildScenarioEvents();
    await ctx.router.route(events.maintenance);
    await ctx.router.route(events.workItemCreated);
    await ctx.router.route(events.evidence);

    const workItem = await ctx.projectionStore.workItemDashboard.get('wi-1');
    expect(workItem?.evidenceCount).toBe(1);
  });

  it('StockReserved e StockConsumed atualizam InventoryProjectionView', async () => {
    const events = buildScenarioEvents();
    await ctx.router.route(events.stockItemRegistered);
    await ctx.router.route(events.stockReserved);
    await ctx.router.route(events.stockConsumed);

    const inventory = await ctx.projectionStore.inventory.get('stock-1');
    expect(inventory).toMatchObject({
      availableQuantity: 95,
      reservedQuantity: 2,
      consumedQuantity: 3,
    });
  });

  it('MeasurementGenerated e InvoiceIssued atualizam FinancialDashboardView', async () => {
    const events = buildScenarioEvents();
    await ctx.router.route(events.workItemCompleted);
    await ctx.router.route(events.measurement);
    await ctx.router.route(events.invoice);
    await ctx.router.route(events.accountReceivable);
    await ctx.router.route(events.accountPayable);

    const financial = await ctx.projectionStore.financialDashboard.get('company-1');
    expect(financial).toMatchObject({
      totalRevenue: 480,
      totalCosts: 480,
      grossMargin: 0,
      invoicesIssued: 1,
      accountsReceivable: 480,
      accountsPayable: 200,
    });
  });

  it('MaintenanceCreated alimenta VehicleHistoryView', async () => {
    const events = buildScenarioEvents();
    await ctx.router.route(events.maintenance);

    const history = await ctx.projectionStore.vehicleHistory.get('vehicle-1');
    expect(history?.totalMaintenances).toBe(1);
    expect(history?.timeline).toHaveLength(1);
    expect(history?.timeline[0].type).toBe('MAINTENANCE');
  });

  it('todos os eventos alimentam AuditTrailView', async () => {
    const events = buildScenarioEvents();
    await ctx.router.route(events.maintenance);
    await ctx.router.route(events.workItemCreated);

    const auditEntries = await ctx.projectionStore.auditTrail.findAll();
    expect(auditEntries.length).toBeGreaterThanOrEqual(2);
    expect(auditEntries.some((e) => e.action === 'MaintenanceCreated')).toBe(true);
    expect(auditEntries.some((e) => e.action === 'WorkItemCreated')).toBe(true);
  });
});
