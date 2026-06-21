import {
  createMaintenanceCreatedEvent,
  createWorkItemCreatedEvent,
  createWorkItemApprovedEvent,
  createWorkItemCompletedEvent,
  createTechnicalAssignmentCreatedEvent,
  createTimeEntryRegisteredEvent,
  createEvidenceUploadedEvent,
  createStockReservedEvent,
  createStockConsumedEvent,
  createMeasurementGeneratedEvent,
  createInvoiceIssuedEvent,
} from '@autosync/domain';

import {
  createStockReleasedEvent,
  createAccountReceivableCreatedEvent,
  createAccountPayableCreatedEvent,
  createStockItemRegisteredEvent,
} from '../../src/events/ProjectionEvents';

import {
  createReadModelContext,
  InMemoryReferenceDataLookup,
} from '../../src';

const META = { companyId: 'company-1', correlationId: 'corr-1' };

export function seedReferenceData(referenceData: InMemoryReferenceDataLookup) {
  referenceData.registerVehicle({ vehicleId: 'vehicle-1', plate: 'ABC-1234' });
  referenceData.registerClient({ clientId: 'client-1', name: 'Cliente Teste' });
  referenceData.registerTechnician({ technicianId: 'tech-1', name: 'João Mecânico' });
}

export function buildScenarioEvents() {
  const maintenance = createMaintenanceCreatedEvent(
    { maintenanceId: 'maint-1', clientId: 'client-1', vehicleId: 'vehicle-1' },
    { ...META, eventId: 'evt-maint-1' },
  );

  const workItemCreated = createWorkItemCreatedEvent(
    {
      workItemId: 'wi-1',
      maintenanceId: 'maint-1',
      description: 'Troca de óleo',
      estimatedCost: 500,
    },
    { ...META, eventId: 'evt-wi-created-1' },
  );

  const workItemApproved = createWorkItemApprovedEvent(
    { workItemId: 'wi-1', maintenanceId: 'maint-1', approvedBy: 'manager-1' },
    { ...META, eventId: 'evt-wi-approved-1' },
  );

  const technicianAssigned = createTechnicalAssignmentCreatedEvent(
    { workItemId: 'wi-1', userId: 'tech-1' },
    { ...META, eventId: 'evt-tech-assigned-1' },
  );

  const timeEntry = createTimeEntryRegisteredEvent(
    { workItemId: 'wi-1', hours: 2 },
    { ...META, eventId: 'evt-time-1' },
  );

  const evidence = createEvidenceUploadedEvent(
    { workItemId: 'wi-1', type: 'PHOTO', url: 'https://example.com/photo.jpg' },
    { ...META, eventId: 'evt-evidence-1' },
  );

  const workItemCompleted = createWorkItemCompletedEvent(
    { workItemId: 'wi-1', totalCost: 480 },
    { ...META, eventId: 'evt-wi-completed-1' },
  );

  const stockItemRegistered = createStockItemRegisteredEvent(
    {
      stockItemId: 'stock-1',
      sku: 'OIL-5W30',
      description: 'Óleo 5W30',
      initialQuantity: 100,
    },
    { ...META, eventId: 'evt-stock-reg-1' },
  );

  const stockReserved = createStockReservedEvent(
    { stockItemId: 'stock-1', quantity: 5, workItemId: 'wi-1' },
    { ...META, eventId: 'evt-stock-res-1' },
  );

  const stockReleased = createStockReleasedEvent(
    { stockItemId: 'stock-1', quantity: 2, workItemId: 'wi-1' },
    { ...META, eventId: 'evt-stock-rel-1' },
  );

  const stockConsumed = createStockConsumedEvent(
    { stockItemId: 'stock-1', quantity: 3 },
    { ...META, eventId: 'evt-stock-con-1' },
  );

  const measurement = createMeasurementGeneratedEvent(
    { measurementId: 'meas-1', period: '2026-06', totalValue: 480, workItemIds: ['wi-1'] },
    { ...META, eventId: 'evt-meas-1' },
  );

  const invoice = createInvoiceIssuedEvent(
    { invoiceId: 'inv-1', type: 'nfse', referenceId: 'maint-1' },
    { ...META, eventId: 'evt-inv-1' },
  );

  const accountReceivable = createAccountReceivableCreatedEvent(
    { accountId: 'ar-1', amount: 480, referenceId: 'wi-1' },
    { ...META, eventId: 'evt-ar-1' },
  );

  const accountPayable = createAccountPayableCreatedEvent(
    { accountId: 'ap-1', amount: 200, referenceId: 'stock-1' },
    { ...META, eventId: 'evt-ap-1' },
  );

  return {
    maintenance,
    workItemCreated,
    workItemApproved,
    technicianAssigned,
    timeEntry,
    evidence,
    workItemCompleted,
    stockItemRegistered,
    stockReserved,
    stockReleased,
    stockConsumed,
    measurement,
    invoice,
    accountReceivable,
    accountPayable,
    all: [
      maintenance,
      workItemCreated,
      workItemApproved,
      technicianAssigned,
      timeEntry,
      evidence,
      workItemCompleted,
      stockItemRegistered,
      stockReserved,
      stockReleased,
      stockConsumed,
      measurement,
      invoice,
      accountReceivable,
      accountPayable,
    ],
  };
}

export async function replayScenario(ctx: ReturnType<typeof createReadModelContext>) {
  const events = buildScenarioEvents();
  seedReferenceData(ctx.referenceData as InMemoryReferenceDataLookup);

  for (const event of events.all) {
    await ctx.eventStore.append(event);
    await ctx.router.route(event);
  }

  return events;
}
