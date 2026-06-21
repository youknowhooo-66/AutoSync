import { describe, it, expect, beforeEach } from 'vitest';
import { TestContext } from './setup/TestContext';

/**
 * E2E: Idempotency Validation Suite
 *
 * Validates that domain events delivered multiple times produce the
 * same result as a single delivery. The system must be safe against
 * at-least-once delivery semantics of message brokers.
 */
describe('End-to-End: Idempotency Validation', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = new TestContext();
  });

  async function createApprovedWorkItem() {
    const companyId = 'company-idempotency';
    const correlationId = 'test-idempotency-1';

    const { maintenanceId } = await ctx.createMaintenanceUseCase.execute({
      companyId,
      vehicleId: 'vehicle-1',
      correlationId,
    });

    await ctx.inventoryRepo.save({
      id: { value: 'stock-item-id-1' } as any,
      companyId: { value: companyId } as any,
      partNumber: 'BRK-001',
      description: 'Brake Pad',
      quantityOnHand: 10,
      unitPrice: 150.00,
      reservedQuantity: 0,
      reserve: function(props: any) { this.reservedQuantity += props.quantity; },
      domainEvents: [],
      addDomainEvent: () => {},
      clearEvents: () => {}
    } as any);

    await ctx.createWorkItemsUseCase.execute({
      maintenanceId,
      diagnosisItems: [
        { description: 'Brake Pad Replacement', estimatedCost: 150.00, type: 'CORRECTIVE', severity: 'HIGH' }
      ],
      correlationId
    });

    const maintenance = await ctx.maintenanceRepo.findById(maintenanceId);
    const workItemId = maintenance!.workItems[0].id.value;

    await ctx.approveWorkItemUseCase.execute({
      maintenanceId,
      workItemId,
      approvedBy: 'manager-1',
      correlationId
    });

    return { maintenanceId, workItemId, companyId, correlationId };
  }

  it('should process the outbox only once even if flushed multiple times', async () => {
    const { workItemId } = await createApprovedWorkItem();

    // Flush once — normal processing
    await ctx.flushOutbox({ batchSize: 50 });

    const assignmentsAfterFirst = ctx.executionRepo.getAssignments().length;
    const inventoryAfterFirst = await ctx.inventoryRepo.findById('stock-item-id-1');
    const reservedAfterFirst = inventoryAfterFirst?.reservedQuantity ?? 0;

    // Flush again — should be a no-op (all events are SENT, not re-processed)
    await ctx.flushOutbox({ batchSize: 50 });

    const assignmentsAfterSecond = ctx.executionRepo.getAssignments().length;
    const inventoryAfterSecond = await ctx.inventoryRepo.findById('stock-item-id-1');
    const reservedAfterSecond = inventoryAfterSecond?.reservedQuantity ?? 0;

    // Results must be identical — no double-processing
    expect(assignmentsAfterSecond).toBe(assignmentsAfterFirst);
    expect(reservedAfterSecond).toBe(reservedAfterFirst);
    expect(await ctx.sagaStore.getState(workItemId)).toBe('APPROVED');
  });

  it('should reject duplicate handler invocation via idempotency store', async () => {
    await createApprovedWorkItem();

    // First flush: processes and marks events as processed in idempotency store
    await ctx.flushOutbox({ batchSize: 50 });
    
    const assignmentsAfterFirstFlush = ctx.executionRepo.getAssignments().length;

    // Manually re-dispatch the same event from the outbox (simulates broker re-delivery)
    const eventsMap = (ctx.outboxStore as any).events as Map<string, any>;
    const workItemApprovedEvent = Array.from(eventsMap.values()).find(
      (e: any) => e.getOriginalEvent().eventType === 'WorkItemApproved'
    );

    if (workItemApprovedEvent) {
      // Re-dispatch the SAME event directly — idempotency middleware should block it
      await ctx.eventBus.dispatch(workItemApprovedEvent.getOriginalEvent());
    }

    const assignmentsAfterRedelivery = ctx.executionRepo.getAssignments().length;

    // The idempotency middleware must have blocked the handler from running again
    expect(assignmentsAfterRedelivery).toBe(assignmentsAfterFirstFlush);
  });

  it('should deduplicate events processed sequentially (not lose data)', async () => {
    const { workItemId } = await createApprovedWorkItem();

    // Sequential flushes: first processes, second is a no-op
    await ctx.flushOutbox({ batchSize: 50 });
    await ctx.flushOutbox({ batchSize: 50 });
    await ctx.flushOutbox({ batchSize: 50 });

    // Final state should still be exactly once — no accumulated duplicates
    expect(await ctx.sagaStore.getState(workItemId)).toBe('APPROVED');
    expect(ctx.executionRepo.getAssignments().length).toBe(1);

    const inventory = await ctx.inventoryRepo.findById('stock-item-id-1');
    expect(inventory?.reservedQuantity).toBe(1);
  });

  it('should not process already SENT outbox events on flush', async () => {
    const { workItemId } = await createApprovedWorkItem();

    // Track how many times dispatch is called
    let dispatchCallCount = 0;
    const original = ctx.eventBus.dispatch.bind(ctx.eventBus);
    ctx.eventBus.dispatch = async (event) => {
      dispatchCallCount++;
      return original(event);
    };

    // First flush
    await ctx.flushOutbox({ batchSize: 50 });
    const firstFlushCalls = dispatchCallCount;

    // Second flush — all events are SENT, dispatch should NOT be called again
    await ctx.flushOutbox({ batchSize: 50 });
    const secondFlushCalls = dispatchCallCount - firstFlushCalls;

    expect(secondFlushCalls).toBe(0);
    expect(await ctx.sagaStore.getState(workItemId)).toBe('APPROVED');
  });
});
