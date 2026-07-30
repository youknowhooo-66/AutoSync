import { describe, it, expect, beforeEach } from 'vitest';
import { createReadModelContext } from '@autosync/read-models';
import { replayScenario } from './helpers/TestFixtures';

describe('Replay Tests', () => {
  let ctx: ReturnType<typeof createReadModelContext>;

  beforeEach(() => {
    ctx = createReadModelContext();
  });

  it('rebuildAll reconstrói todas as projeções a partir do event store', async () => {
    await replayScenario(ctx);

    const snapshotBefore = await captureSnapshot(ctx);

    await ctx.projectionStore.clearAll();
    expect(await ctx.projectionStore.workItemDashboard.findAll()).toHaveLength(0);

    await ctx.replayService.rebuildAll();
    const snapshotAfter = await captureSnapshot(ctx);

    expect(snapshotAfter).toEqual(snapshotBefore);
  });

  it('rebuildProjection reconstrói apenas a projeção solicitada', async () => {
    await replayScenario(ctx);

    const workItemBefore = await ctx.projectionStore.workItemDashboard.get('wi-1');
    await ctx.projectionStore.workItemDashboard.clear();

    expect(await ctx.projectionStore.workItemDashboard.get('wi-1')).toBeNull();
    expect(await ctx.projectionStore.maintenanceOverview.get('maint-1')).not.toBeNull();

    await ctx.replayService.rebuildProjection('workItemDashboard');

    const workItemAfter = await ctx.projectionStore.workItemDashboard.get('wi-1');
    expect(workItemAfter).toEqual(workItemBefore);
  });

  it('reprocessamento completo produz o mesmo resultado final', async () => {
    await replayScenario(ctx);
    const firstRun = await captureSnapshot(ctx);

    await ctx.replayService.rebuildAll();
    const secondRun = await captureSnapshot(ctx);

    expect(secondRun).toEqual(firstRun);
  });
});

async function captureSnapshot(ctx: ReturnType<typeof createReadModelContext>) {
  return {
    workItems: await ctx.projectionStore.workItemDashboard.findAll(),
    maintenances: await ctx.projectionStore.maintenanceOverview.findAll(),
    inventory: await ctx.projectionStore.inventory.findAll(),
    technicians: await ctx.projectionStore.technicianProductivity.findAll(),
    financial: await ctx.projectionStore.financialDashboard.findAll(),
    vehicles: await ctx.projectionStore.vehicleHistory.findAll(),
    audit: await ctx.projectionStore.auditTrail.findAll(),
  };
}
