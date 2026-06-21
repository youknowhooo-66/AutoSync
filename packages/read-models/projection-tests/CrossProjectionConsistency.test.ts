import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryEventBus } from '@autosync/infrastructure';
import {
  createReadModelContext,
  registerProjections,
  InMemoryReferenceDataLookup,
  withProjectionHandlerIdempotency,
} from '@autosync/read-models';
import { InMemoryIdempotencyStore } from '@autosync/infrastructure';
import { seedReferenceData, buildScenarioEvents } from './helpers/TestFixtures';

describe('Cross-Projection Consistency', () => {
  let ctx: ReturnType<typeof createReadModelContext>;
  let eventBus: InMemoryEventBus;

  beforeEach(() => {
    ctx = createReadModelContext();
    seedReferenceData(ctx.referenceData as InMemoryReferenceDataLookup);
    eventBus = new InMemoryEventBus();

    const idempotencyStore = new InMemoryIdempotencyStore();
    registerProjections({
      eventBus,
      handlerIdempotencyStore: idempotencyStore,
      wrapHandler: withProjectionHandlerIdempotency(idempotencyStore),
      projectionStore: ctx.projectionStore,
      referenceData: ctx.referenceData,
      eventStore: ctx.eventStore,
      idempotencyTracker: ctx.idempotencyTracker,
    });
  });

  it('WorkItemCompleted atualiza WorkItemDashboard, MaintenanceOverview e FinancialDashboard de forma consistente', async () => {
    const events = buildScenarioEvents();

    await eventBus.dispatchAll([
      events.maintenance,
      events.workItemCreated,
      events.workItemApproved,
      events.workItemCompleted,
    ]);

    const workItem = await ctx.projectionStore.workItemDashboard.get('wi-1');
    const maintenance = await ctx.projectionStore.maintenanceOverview.get('maint-1');
    const financial = await ctx.projectionStore.financialDashboard.get('company-1');

    expect(workItem?.status).toBe('COMPLETED');
    expect(workItem?.actualCost).toBe(480);

    expect(maintenance?.completedWorkItems).toBe(1);
    expect(maintenance?.actualValue).toBe(480);
    expect(maintenance?.status).toBe('COMPLETED');

    expect(financial?.totalCosts).toBe(480);

    expect(workItem?.actualCost).toBe(maintenance?.actualValue);
    expect(maintenance?.actualValue).toBe(financial?.totalCosts);
  });

  it('fluxo completo mantém consistência entre todas as projeções', async () => {
    const events = buildScenarioEvents();

    await eventBus.dispatchAll(events.all);

    const workItem = await ctx.projectionStore.workItemDashboard.get('wi-1');
    const maintenance = await ctx.projectionStore.maintenanceOverview.get('maint-1');
    const financial = await ctx.projectionStore.financialDashboard.get('company-1');
    const vehicle = await ctx.projectionStore.vehicleHistory.get('vehicle-1');
    const technician = await ctx.projectionStore.technicianProductivity.get('tech-1');

    expect(workItem?.evidenceCount).toBe(1);
    expect(workItem?.assignedTechnicianId).toBe('tech-1');

    expect(maintenance?.totalWorkItems).toBe(1);
    expect(maintenance?.completedWorkItems).toBe(1);

    expect(financial?.totalRevenue).toBe(480);
    expect(financial?.invoicesIssued).toBe(1);

    expect(vehicle?.totalMaintenances).toBe(1);
    expect(vehicle?.totalSpent).toBe(480);
    expect(vehicle?.timeline.length).toBeGreaterThanOrEqual(2);

    expect(technician?.totalHoursWorked).toBe(2);
    expect(technician?.completedWorkItems).toBe(1);
  });

  it('evento duplicado via event bus não causa inconsistência', async () => {
    const events = buildScenarioEvents();

    await eventBus.dispatchAll([
      events.maintenance,
      events.workItemCreated,
      events.workItemApproved,
      events.workItemCompleted,
    ]);

    await eventBus.dispatch(events.workItemCompleted);

    const workItem = await ctx.projectionStore.workItemDashboard.get('wi-1');
    const maintenance = await ctx.projectionStore.maintenanceOverview.get('maint-1');
    const financial = await ctx.projectionStore.financialDashboard.get('company-1');

    expect(workItem?.actualCost).toBe(480);
    expect(maintenance?.completedWorkItems).toBe(1);
    expect(financial?.totalCosts).toBe(480);
  });
});
