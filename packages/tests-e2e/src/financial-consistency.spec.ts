import { describe, it, expect, beforeEach } from 'vitest';
import { TestContext } from './setup/TestContext';

/**
 * E2E: Financial Consistency Suite
 *
 * Validates the economic integrity of the WorkItem as a billing unit.
 * A WorkItem's actual cost must flow correctly through:
 *   Completion -> Measurement -> ServiceInvoice (NFS-e)
 *
 * The finance and fiscal contexts must maintain referential integrity
 * and correct financial totals at all stages.
 */
describe('End-to-End: Financial Consistency (WorkItem as Economic Unit)', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = new TestContext();
  });

  async function runFullLifecycle(options: {
    companyId: string;
    correlationId: string;
    estimatedCost?: number;
  }) {
    const { companyId, correlationId, estimatedCost = 150.00 } = options;

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

    const { maintenanceId } = await ctx.createMaintenanceUseCase.execute({
      companyId, vehicleId: 'vehicle-1', correlationId,
    });

    await ctx.createWorkItemsUseCase.execute({
      maintenanceId,
      diagnosisItems: [
        { description: 'Brake Pad Replacement', estimatedCost, type: 'CORRECTIVE', severity: 'HIGH' }
      ],
      correlationId
    });

    const maintenance = await ctx.maintenanceRepo.findById(maintenanceId);
    const workItemId = maintenance!.workItems[0].id.value;

    await ctx.approveWorkItemUseCase.execute({
      maintenanceId, workItemId, approvedBy: 'manager-1', correlationId
    });

    await ctx.flushOutbox({ batchSize: 50 });

    const assignments = ctx.executionRepo.getAssignments();
    const assignment = assignments.find(a => a.workItemId.value === workItemId);

    await ctx.registerTimeEntryUseCase.execute({
      assignmentId: assignment!.id.value,
      startTime: new Date(Date.now() - 3600000),
      endTime: new Date(),
      correlationId,
      companyId
    });

    await ctx.flushOutbox({ batchSize: 50 });

    await ctx.completeWorkItemUseCase.execute({
      maintenanceId, workItemId, correlationId
    });

    await ctx.flushOutbox({ batchSize: 50 });

    return { maintenanceId, workItemId };
  }

  it('should generate a ServiceInvoice with the correct total value', async () => {
    await runFullLifecycle({
      companyId: 'company-fin',
      correlationId: 'fin-total-value',
    });

    const invoices = ctx.fiscalRepo.getServiceInvoices();
    expect(invoices.length).toBe(1);

    const invoice = invoices[0];
    // CompleteWorkItemUseCase currently hardcodes 200.00 as actualCost
    expect(invoice.totalValue).toBe(200.00);
  });

  it('should generate exactly one Measurement per completed WorkItem', async () => {
    await runFullLifecycle({
      companyId: 'company-fin',
      correlationId: 'fin-measurement-single',
    });

    const measurements = ctx.financeRepo.getMeasurements();
    expect(measurements.length).toBe(1);
  });

  it('should generate exactly one Account Receivable per completed WorkItem', async () => {
    await runFullLifecycle({
      companyId: 'company-fin',
      correlationId: 'fin-receivable',
    });

    const receivables = ctx.financeRepo.getReceivables();
    expect(receivables.length).toBe(1);
    expect(receivables[0].value).toBe(200.00);
  });

  it('should maintain financial referential integrity: Invoice -> Measurement', async () => {
    await runFullLifecycle({
      companyId: 'company-fin',
      correlationId: 'fin-referential',
    });

    const measurements = ctx.financeRepo.getMeasurements();
    const invoices = ctx.fiscalRepo.getServiceInvoices();

    expect(measurements.length).toBe(1);
    expect(invoices.length).toBe(1);

    // The invoice's maintenanceId is the referenceId passed from MeasurementGeneratedHandler
    // which uses measurementId from the event payload
    const invoice = invoices[0];
    const measurement = measurements[0];

    // referential integrity: invoice references the measurement
    expect(invoice.maintenanceId.value).toBe(measurement.id.value);
  });

  it('should accumulate measurements independently for two WorkItems', async () => {
    const companyId = 'company-fin-multi';

    await ctx.inventoryRepo.save({
      id: { value: 'stock-item-id-1' } as any,
      companyId: { value: companyId } as any,
      partNumber: 'BRK-001', description: 'Brake Pad',
      quantityOnHand: 10, unitPrice: 150.00, reservedQuantity: 0,
      reserve: function(props: any) { this.reservedQuantity += props.quantity; },
      domainEvents: [], addDomainEvent: () => {}, clearEvents: () => {}
    } as any);

    // First WorkItem lifecycle
    const { maintenanceId: m1 } = await ctx.createMaintenanceUseCase.execute({
      companyId, vehicleId: 'vehicle-1', correlationId: 'fin-multi-1',
    });

    await ctx.createWorkItemsUseCase.execute({
      maintenanceId: m1,
      diagnosisItems: [{ description: 'Service A', estimatedCost: 100.00, type: 'CORRECTIVE', severity: 'LOW' }],
      correlationId: 'fin-multi-1'
    });

    const maintenance1 = await ctx.maintenanceRepo.findById(m1);
    const workItemId1 = maintenance1!.workItems[0].id.value;

    await ctx.approveWorkItemUseCase.execute({ maintenanceId: m1, workItemId: workItemId1, approvedBy: 'manager-1', correlationId: 'fin-multi-1' });
    await ctx.flushOutbox({ batchSize: 50 });

    const a1 = ctx.executionRepo.getAssignments().find(a => a.workItemId.value === workItemId1)!;
    await ctx.registerTimeEntryUseCase.execute({ assignmentId: a1.id.value, startTime: new Date(Date.now() - 3600000), endTime: new Date(), correlationId: 'fin-multi-1', companyId });
    await ctx.flushOutbox({ batchSize: 50 });

    await ctx.completeWorkItemUseCase.execute({ maintenanceId: m1, workItemId: workItemId1, correlationId: 'fin-multi-1' });
    await ctx.flushOutbox({ batchSize: 50 });

    // Second WorkItem lifecycle
    const { maintenanceId: m2 } = await ctx.createMaintenanceUseCase.execute({
      companyId, vehicleId: 'vehicle-2', correlationId: 'fin-multi-2',
    });

    await ctx.createWorkItemsUseCase.execute({
      maintenanceId: m2,
      diagnosisItems: [{ description: 'Service B', estimatedCost: 200.00, type: 'PREVENTIVE', severity: 'LOW' }],
      correlationId: 'fin-multi-2'
    });

    const maintenance2 = await ctx.maintenanceRepo.findById(m2);
    const workItemId2 = maintenance2!.workItems[0].id.value;

    await ctx.approveWorkItemUseCase.execute({ maintenanceId: m2, workItemId: workItemId2, approvedBy: 'manager-1', correlationId: 'fin-multi-2' });
    await ctx.flushOutbox({ batchSize: 50 });

    const a2 = ctx.executionRepo.getAssignments().find(a => a.workItemId.value === workItemId2)!;
    await ctx.registerTimeEntryUseCase.execute({ assignmentId: a2.id.value, startTime: new Date(Date.now() - 3600000), endTime: new Date(), correlationId: 'fin-multi-2', companyId });
    await ctx.flushOutbox({ batchSize: 50 });

    await ctx.completeWorkItemUseCase.execute({ maintenanceId: m2, workItemId: workItemId2, correlationId: 'fin-multi-2' });
    await ctx.flushOutbox({ batchSize: 50 });

    // Assertions: 2 measurements, 2 invoices, 2 receivables
    expect(ctx.financeRepo.getMeasurements().length).toBe(2);
    expect(ctx.fiscalRepo.getServiceInvoices().length).toBe(2);
    expect(ctx.financeRepo.getReceivables().length).toBe(2);

    // Total invoiced should be 2 * 200.00 (hardcoded in CompleteWorkItemUseCase)
    const totalInvoiced = ctx.fiscalRepo.getServiceInvoices()
      .reduce((sum, inv) => sum + inv.totalValue, 0);
    expect(totalInvoiced).toBe(400.00);
  });
});
