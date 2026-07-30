import { describe, it, expect, beforeEach } from 'vitest';
import { TestContext } from './setup/TestContext';

/**
 * E2E: Inventory Consistency Suite
 *
 * Validates that the Inventory context maintains correct stock levels
 * and prevents double-reservations (race conditions). The domain model
 * must guarantee that reservedQuantity + consumedQuantity <= quantityOnHand.
 */
describe('End-to-End: Inventory Consistency', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = new TestContext();
  });

  function seedStockItem(quantityOnHand: number) {
    return ctx.inventoryRepo.save({
      id: { value: 'stock-item-id-1' } as any,
      companyId: { value: 'company-inv' } as any,
      partNumber: 'BRK-001',
      description: 'Brake Pad',
      quantityOnHand,
      unitPrice: 150.00,
      reservedQuantity: 0,
      reserve: function(props: any) {
        if (this.reservedQuantity + props.quantity > this.quantityOnHand) {
          throw new Error(`Insufficient stock: cannot reserve ${props.quantity}, only ${this.quantityOnHand - this.reservedQuantity} available`);
        }
        this.reservedQuantity += props.quantity;
      },
      domainEvents: [],
      addDomainEvent: () => {},
      clearEvents: () => {}
    } as any);
  }

  async function createAndApproveWorkItem(maintenanceId: string, correlationId: string) {
    const companyId = 'company-inv';
    await ctx.createWorkItemsUseCase.execute({
      maintenanceId,
      diagnosisItems: [
        { description: 'Brake Pad Replacement', estimatedCost: 150.00, type: 'CORRECTIVE', severity: 'HIGH' }
      ],
      correlationId
    });

    const maintenance = await ctx.maintenanceRepo.findById(maintenanceId);
    const workItemId = maintenance!.workItems[maintenance!.workItems.length - 1].id.value;

    await ctx.approveWorkItemUseCase.execute({
      maintenanceId, workItemId, approvedBy: 'manager-1', correlationId
    });

    return workItemId;
  }

  it('should reserve stock correctly for a single WorkItem', async () => {
    const companyId = 'company-inv';
    const correlationId = 'inv-single';

    await seedStockItem(10);

    const { maintenanceId } = await ctx.createMaintenanceUseCase.execute({
      companyId, vehicleId: 'vehicle-1', correlationId,
    });

    await createAndApproveWorkItem(maintenanceId, correlationId);
    await ctx.flushOutbox({ batchSize: 50 });

    const inventory = await ctx.inventoryRepo.findById('stock-item-id-1');
    expect(inventory?.reservedQuantity).toBe(1);
  });

  it('should correctly accumulate reservations for multiple WorkItems', async () => {
    const companyId = 'company-inv';
    const correlationId = 'inv-multi';

    await seedStockItem(10);

    const { maintenanceId } = await ctx.createMaintenanceUseCase.execute({
      companyId, vehicleId: 'vehicle-1', correlationId,
    });

    // Add & approve 3 WorkItems — each reserves 1 unit of same stock item
    await createAndApproveWorkItem(maintenanceId, correlationId + '-1');
    await createAndApproveWorkItem(maintenanceId, correlationId + '-2');
    await createAndApproveWorkItem(maintenanceId, correlationId + '-3');
    
    await ctx.flushOutbox({ batchSize: 50 });

    const inventory = await ctx.inventoryRepo.findById('stock-item-id-1');
    // Each WorkItem approved triggers 1 reservation — expect 3
    expect(inventory?.reservedQuantity).toBe(3);
    
    // Available quantity must still be correct
    expect(inventory!.quantityOnHand - inventory!.reservedQuantity).toBe(7);
  });

  it('should throw when trying to reserve more than available stock', async () => {
    const companyId = 'company-inv';
    const correlationId = 'inv-overflow';

    // Only 1 unit available
    await seedStockItem(1);

    const { maintenanceId } = await ctx.createMaintenanceUseCase.execute({
      companyId, vehicleId: 'vehicle-1', correlationId,
    });

    // Approve first item — reserves 1 unit (now 0 available)
    await createAndApproveWorkItem(maintenanceId, correlationId + '-1');
    await ctx.flushOutbox({ batchSize: 50 });

    const inventoryAfterFirst = await ctx.inventoryRepo.findById('stock-item-id-1');
    expect(inventoryAfterFirst?.reservedQuantity).toBe(1);

    // Approve second item — tries to reserve when 0 available
    // ReserveStockForWorkItemUseCase should fail, event goes to DLQ
    await createAndApproveWorkItem(maintenanceId, correlationId + '-2');
    
    // Don't expect an exception from flushOutbox since errors are caught + retried
    await ctx.flushOutbox({ batchSize: 50 });

    // Stock must NOT have been over-reserved
    const inventoryAfterSecond = await ctx.inventoryRepo.findById('stock-item-id-1');
    expect(inventoryAfterSecond?.reservedQuantity).toBe(1); // still 1, not 2

    // The failed event should be in DLQ or have failed retries
    const dlqItems = (ctx.dlq as any).items || [];
    // Either DLQ or failed events — system didn't silently corrupt state
    const failedEvents = Array.from((ctx.outboxStore as any).events.values()).filter(
      (e: any) => e.status === 'FAILED'
    );
    expect(dlqItems.length + failedEvents.length).toBeGreaterThan(0);
  });

  it('should maintain reservedQuantity <= quantityOnHand invariant at all times', async () => {
    const companyId = 'company-inv';
    const correlationId = 'inv-invariant';

    await seedStockItem(5);

    const { maintenanceId } = await ctx.createMaintenanceUseCase.execute({
      companyId, vehicleId: 'vehicle-1', correlationId,
    });

    // Create 5 WorkItems (exactly at the limit)
    for (let i = 0; i < 5; i++) {
      await createAndApproveWorkItem(maintenanceId, `${correlationId}-${i}`);
    }

    await ctx.flushOutbox({ batchSize: 50 });

    const inventory = await ctx.inventoryRepo.findById('stock-item-id-1');

    // Core invariant: reservedQuantity must not exceed quantityOnHand
    expect(inventory!.reservedQuantity).toBeLessThanOrEqual(inventory!.quantityOnHand);
    // All 5 should have reserved (exact stock count)
    expect(inventory!.reservedQuantity).toBe(5);
  });
});
