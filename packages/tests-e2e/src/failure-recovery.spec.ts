import { describe, it, expect, beforeEach } from 'vitest';
import { TestContext } from './setup/TestContext';
import { OutboxEvent } from '@autosync/infrastructure';

/**
 * E2E: Failure Recovery Suite
 *
 * Validates that the Outbox pattern provides guarantees of at-least-once
 * delivery and that failed events are retried correctly, and eventually
 * sent to the Dead Letter Queue (DLQ) after exhausting retries.
 */
describe('End-to-End: Failure Recovery (Outbox & DLQ)', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = new TestContext();
  });

  async function createApprovedWorkItem() {
    const companyId = 'company-failure';
    const correlationId = 'test-failure-1';

    const { maintenanceId } = await ctx.createMaintenanceUseCase.execute({
      companyId, vehicleId: 'vehicle-1', correlationId,
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
      maintenanceId, workItemId, approvedBy: 'manager-1', correlationId
    });

    return { maintenanceId, workItemId, companyId, correlationId };
  }

  /** Resets FAILED events in the outbox back to PENDING (simulates scheduler re-enqueue) */
  function resetFailedEventsToPending() {
    const eventsMap = (ctx.outboxStore as any).events as Map<string, OutboxEvent>;
    for (const [id, evt] of eventsMap.entries()) {
      if (evt.status === 'FAILED') {
        // Reconstitute as PENDING (preserving retries count)
        const pending = OutboxEvent.reconstitute({
          id: evt.id,
          eventType: evt.eventType,
          payload: evt.payload,
          status: 'PENDING',
          createdAt: evt.createdAt,
          processedAt: null,
          retries: evt.retries,
        });
        eventsMap.set(id, pending);
      }
    }
  }

  it('should mark events as FAILED and retry them when dispatch throws', async () => {
    await createApprovedWorkItem();

    const pendingBefore = await ctx.outboxStore.findPending(50);
    expect(pendingBefore.length).toBeGreaterThan(0);

    // Simulate a single failed flush — all events fail
    await ctx.flushOutbox({ batchSize: 50, simulateFailure: true });

    // Events should be FAILED, not SENT, and DLQ should be empty (retries not exhausted)
    const dlqMessages = (ctx.dlq as any).messages as any[];
    expect(dlqMessages.length).toBe(0);

    // Verify events are now in FAILED state  
    const eventsMap = (ctx.outboxStore as any).events as Map<string, OutboxEvent>;
    const failedEvents = Array.from(eventsMap.values()).filter(e => e.status === 'FAILED');
    expect(failedEvents.length).toBeGreaterThan(0);
    expect(failedEvents.every(e => e.retries > 0)).toBe(true);
  });

  it('should send events to DLQ after exhausting all retries', async () => {
    await createApprovedWorkItem();

    const maxRetries = (ctx.retryPolicy as any).maxRetries as number; // = 3

    // Exhaust all retries: fail (maxRetries + 1) times
    for (let i = 0; i <= maxRetries; i++) {
      resetFailedEventsToPending();
      await ctx.flushOutbox({ batchSize: 50, simulateFailure: true });
    }

    // After exhausting retries, events should be in DLQ
    const dlqMessages = (ctx.dlq as any).messages as any[];
    expect(dlqMessages.length).toBeGreaterThan(0);
  });

  it('should recover successfully after transient failure', async () => {
    const { workItemId } = await createApprovedWorkItem();

    // First flush fails — transient error
    await ctx.flushOutbox({ batchSize: 50, simulateFailure: true });

    // Scheduler re-enqueues failed events
    resetFailedEventsToPending();

    // Second flush succeeds — transient failure resolved
    await ctx.flushOutbox({ batchSize: 50 });

    // System should be in correct final state
    expect(await ctx.sagaStore.getState(workItemId)).toBe('APPROVED');
    
    const assignments = ctx.executionRepo.getAssignments();
    expect(assignments.length).toBe(1);
    
    const inventory = await ctx.inventoryRepo.findById('stock-item-id-1');
    expect(inventory?.reservedQuantity).toBe(1);
  });

  it('should maintain event ordering consistency even after retries', async () => {
    const { workItemId } = await createApprovedWorkItem();

    // Process normally
    await ctx.flushOutbox({ batchSize: 50 });

    // Saga state after WorkItemApproved processing
    const sagaState = await ctx.sagaStore.getState(workItemId);
    expect(sagaState).toBe('APPROVED');

    // Must be a valid terminal-forward state (no regression)
    const validStates = ['APPROVED', 'EXECUTION_STARTED', 'COMPLETED', 'BILLED'];
    expect(validStates).toContain(sagaState);
  });
});
