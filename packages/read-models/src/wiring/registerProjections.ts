import { IEventBus } from '@autosync/application';
import { DomainEvent } from '@autosync/domain';
import { IProjectionStore, InMemoryProjectionStore } from '../repositories';
import {
  InMemoryReferenceDataLookup,
  IReferenceDataLookup,
} from '../projections/shared/ReferenceDataLookup';
import {
  InMemoryProjectionIdempotencyTracker,
  IProjectionIdempotencyTracker,
} from '../projections/shared/ProjectionIdempotency';
import { InMemoryEventStore, IEventStore } from '../replay/IEventStore';
import { ProjectionRegistry } from '../handlers/ProjectionRegistry';
import { ProjectionEventRouter, ProjectionHandlers } from '../replay/ProjectionEventRouter';
import { ProjectionReplayService } from '../replay/ProjectionReplayService';
import {
  MaintenanceCreatedProjectionHandler,
  WorkItemCreatedProjectionHandler,
  WorkItemApprovedProjectionHandler,
  TechnicianAssignedProjectionHandler,
  TimeEntryRegisteredProjectionHandler,
  EvidenceUploadedProjectionHandler,
  WorkItemCompletedProjectionHandler,
  StockReservedProjectionHandler,
  StockReleasedProjectionHandler,
  StockConsumedProjectionHandler,
  StockItemRegisteredProjectionHandler,
  MeasurementGeneratedProjectionHandler,
  InvoiceIssuedProjectionHandler,
  AccountReceivableCreatedProjectionHandler,
  AccountPayableCreatedProjectionHandler,
  AuditTrailProjectionHandler,
} from '../handlers';
import {
  IHandlerIdempotencyStore,
  SecureHandlerFactory,
  withProjectionHandlerIdempotency,
} from './HandlerIdempotency';

export interface IProjectionEventBus extends IEventBus {
  subscribe(
    eventType: string,
    handler: (event: DomainEvent<unknown>) => Promise<void>,
  ): void;
}

export interface ReadModelContext {
  projectionStore: IProjectionStore;
  referenceData: IReferenceDataLookup;
  eventStore: IEventStore;
  idempotencyTracker: IProjectionIdempotencyTracker;
  registry: ProjectionRegistry;
  router: ProjectionEventRouter;
  replayService: ProjectionReplayService;
  handlers: ProjectionHandlers;
}

export interface RegisterProjectionsOptions {
  eventBus: IProjectionEventBus;
  handlerIdempotencyStore: IHandlerIdempotencyStore;
  wrapHandler?: SecureHandlerFactory;
  projectionStore?: IProjectionStore;
  referenceData?: IReferenceDataLookup;
  eventStore?: IEventStore;
  idempotencyTracker?: IProjectionIdempotencyTracker;
}

const PROJECTION_EVENT_TYPES = [
  'MaintenanceCreated',
  'WorkItemCreated',
  'WorkItemApproved',
  'WorkItemRejected',
  'WorkItemCompleted',
  'TechnicalAssignmentCreated',
  'TimeEntryRegistered',
  'EvidenceUploaded',
  'StockReserved',
  'StockReleased',
  'StockConsumed',
  'StockItemRegistered',
  'MeasurementGenerated',
  'InvoiceIssued',
  'AccountReceivableCreated',
  'AccountPayableCreated',
];

export function createReadModelContext(
  options?: Partial<
    Pick<
      RegisterProjectionsOptions,
      'projectionStore' | 'referenceData' | 'eventStore' | 'idempotencyTracker'
    >
  >,
): ReadModelContext {
  const projectionStore = options?.projectionStore ?? new InMemoryProjectionStore();
  const referenceData = options?.referenceData ?? new InMemoryReferenceDataLookup();
  const eventStore = options?.eventStore ?? new InMemoryEventStore();
  const idempotencyTracker = options?.idempotencyTracker ?? new InMemoryProjectionIdempotencyTracker();

  const registry = new ProjectionRegistry(projectionStore, referenceData, idempotencyTracker);

  const handlers: ProjectionHandlers = {
    maintenanceCreated: new MaintenanceCreatedProjectionHandler(registry),
    workItemCreated: new WorkItemCreatedProjectionHandler(registry),
    workItemApproved: new WorkItemApprovedProjectionHandler(registry),
    technicianAssigned: new TechnicianAssignedProjectionHandler(registry),
    timeEntryRegistered: new TimeEntryRegisteredProjectionHandler(registry),
    evidenceUploaded: new EvidenceUploadedProjectionHandler(registry),
    workItemCompleted: new WorkItemCompletedProjectionHandler(registry, projectionStore),
    stockReserved: new StockReservedProjectionHandler(registry),
    stockReleased: new StockReleasedProjectionHandler(registry),
    stockConsumed: new StockConsumedProjectionHandler(registry),
    stockItemRegistered: new StockItemRegisteredProjectionHandler(registry),
    measurementGenerated: new MeasurementGeneratedProjectionHandler(registry),
    invoiceIssued: new InvoiceIssuedProjectionHandler(registry),
    accountReceivableCreated: new AccountReceivableCreatedProjectionHandler(registry),
    accountPayableCreated: new AccountPayableCreatedProjectionHandler(registry),
    auditTrail: new AuditTrailProjectionHandler(registry),
  };

  const router = new ProjectionEventRouter(handlers);
  const replayService = new ProjectionReplayService(
    eventStore,
    projectionStore,
    router,
    idempotencyTracker,
  );

  return {
    projectionStore,
    referenceData,
    eventStore,
    idempotencyTracker,
    registry,
    router,
    replayService,
    handlers,
  };
}

export function registerProjections(options: RegisterProjectionsOptions): ReadModelContext {
  const context = createReadModelContext({
    projectionStore: options.projectionStore,
    referenceData: options.referenceData,
    eventStore: options.eventStore,
    idempotencyTracker: options.idempotencyTracker,
  });

  const { eventBus, handlerIdempotencyStore } = options;
  const wrapHandler = options.wrapHandler ?? withProjectionHandlerIdempotency(handlerIdempotencyStore);
  const { eventStore, router } = context;

  for (const eventType of PROJECTION_EVENT_TYPES) {
    const handlerName = `Projection:${eventType}`;
    const secureHandler = wrapHandler(
      handlerName,
      async (event: DomainEvent<unknown>) => {
        await eventStore.append(event);
        await router.route(event);
      },
    );

    eventBus.subscribe(eventType, secureHandler);
  }

  const auditHandler = wrapHandler(
    'Projection:AuditTrail',
    async (event: DomainEvent<unknown>) => {
      await eventStore.append(event);
      await context.handlers.auditTrail.handle(event);
    },
  );

  eventBus.subscribe('WorkItemRejected', auditHandler);

  return context;
}
