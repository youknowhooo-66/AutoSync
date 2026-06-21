import { describe, it, expect, beforeEach } from 'vitest';
import { TestContext } from './setup/TestContext';

describe('End-to-End: WorkItem to Invoice (Happy Path)', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = new TestContext();
  });

  it('should process a full workitem lifecycle through to NFSE generation', async () => {
    const companyId = 'company-1';
    const correlationId = 'test-flow-1';

    // 1. Create Maintenance
    const { maintenanceId } = await ctx.createMaintenanceUseCase.execute({
      companyId,
      vehicleId: 'vehicle-1',
      correlationId,
    });
    
    expect(maintenanceId).toBeDefined();

    // Mock Inventory for reservation
    await ctx.inventoryRepo.save({
      id: { value: 'stock-item-id-1' } as any,
      companyId: { value: companyId } as any,
      partNumber: 'BRK-001',
      description: 'Brake Pad',
      quantityOnHand: 10,
      unitPrice: 150.00,
      reservedQuantity: 0,
      // Provide basic mock methods to satisfy InventoryItem methods if needed by use case
      reserve: function(props: any) { this.reservedQuantity += props.quantity; },
      domainEvents: [],
      addDomainEvent: () => {},
      clearEvents: () => {}
    } as any);

    // 2. Add WorkItem
    await ctx.createWorkItemsUseCase.execute({
      maintenanceId,
      diagnosisItems: [
        {
          description: 'Brake Pad Replacement',
          estimatedCost: 150.00,
          type: 'CORRECTIVE',
          severity: 'HIGH'
        }
      ],
      correlationId
    });

    const maintenance = await ctx.maintenanceRepo.findById(maintenanceId);
    expect(maintenance?.workItems).toHaveLength(1);
    const workItem = maintenance!.workItems[0];
    const workItemId = workItem.id.value;

    // 3. Approve WorkItem
    await ctx.approveWorkItemUseCase.execute({
      maintenanceId,
      workItemId,
      approvedBy: 'manager-1',
      correlationId
    });

    const approvedWorkItem = await ctx.maintenanceRepo.findById(maintenanceId);
    expect(approvedWorkItem?.workItems[0].status).toBe('APPROVED');

    // 4. Flush Outbox (Process WorkItemApproved)
    // This will trigger ReserveStock and AssignTechnician Use Cases via Handlers
    await ctx.flushOutbox({ batchSize: 50 });

    // Verify Saga state
    expect(await ctx.sagaStore.getState(workItemId)).toBe('APPROVED');

    // Verify Technician was assigned in Execution context
    const assignments = ctx.executionRepo.getAssignments();
    const assignment = assignments.find(a => a.workItemId.value === workItemId);
    expect(assignment).toBeDefined();

    // Verify Stock was reserved in Inventory context
    const inventory = await ctx.inventoryRepo.findById('stock-item-id-1');
    expect(inventory).toBeDefined();
    expect(inventory?.reservedQuantity).toBe(1);

    // 5. Register Time Entry
    await ctx.registerTimeEntryUseCase.execute({
      assignmentId: assignment!.id.value,
      startTime: new Date(Date.now() - 3600000), // 1 hour ago
      endTime: new Date(),
      correlationId,
      companyId
    });

    await ctx.flushOutbox({ batchSize: 50 });
    
    // Saga state should be EXECUTION_STARTED
    expect(await ctx.sagaStore.getState(workItemId)).toBe('EXECUTION_STARTED');

    // 6. Complete WorkItem
    await ctx.completeWorkItemUseCase.execute({
      maintenanceId,
      workItemId,
      correlationId
    });

    await ctx.flushOutbox({ batchSize: 50 });

    // Verify Saga state
    expect(await ctx.sagaStore.getState(workItemId)).toBe('BILLED');

    // Verify measurement was created
    // MeasurementGeneratedHandler is supposed to issue an Invoice.
    
    // Let's verify Fiscal Repository has an invoice
    const allInvoices = ctx.fiscalRepo.getServiceInvoices();
    expect(allInvoices.length).toBeGreaterThan(0);
    const invoice = allInvoices[0];
    expect(invoice.maintenanceId).toBeDefined();
    expect(invoice.totalValue).toBe(200.00); // 200.00 is hardcoded in CompleteWorkItemUseCase mock
  });
});
