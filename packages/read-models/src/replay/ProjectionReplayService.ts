import { DomainEvent } from '@autosync/domain';
import { ProjectionName, IProjectionStore } from '../repositories';
import { IEventStore } from './IEventStore';
import { ProjectionEventRouter } from './ProjectionEventRouter';
import { IProjectionIdempotencyTracker } from '../projections/shared/ProjectionIdempotency';

const PROJECTION_EVENT_MAP: Record<ProjectionName, string[]> = {
  workItemDashboard: [
    'WorkItemCreated',
    'WorkItemApproved',
    'TechnicalAssignmentCreated',
    'TimeEntryRegistered',
    'EvidenceUploaded',
    'WorkItemCompleted',
  ],
  maintenanceOverview: [
    'MaintenanceCreated',
    'WorkItemCreated',
    'WorkItemApproved',
    'WorkItemCompleted',
  ],
  inventory: [
    'StockItemRegistered',
    'StockReserved',
    'StockReleased',
    'StockConsumed',
  ],
  technicianProductivity: ['TimeEntryRegistered', 'WorkItemCompleted'],
  financialDashboard: [
    'MeasurementGenerated',
    'InvoiceIssued',
    'AccountReceivableCreated',
    'AccountPayableCreated',
    'WorkItemCompleted',
  ],
  vehicleHistory: ['MaintenanceCreated', 'WorkItemCompleted', 'InvoiceIssued'],
  auditTrail: ['*'],
};

export class ProjectionReplayService {
  constructor(
    private readonly eventStore: IEventStore,
    private readonly projectionStore: IProjectionStore,
    private readonly router: ProjectionEventRouter,
    private readonly idempotencyTracker: IProjectionIdempotencyTracker,
  ) {}

  async rebuildAll(): Promise<void> {
    await this.projectionStore.clearAll();
    await this.idempotencyTracker.clear();
    const events = await this.eventStore.getAll();
    await this.replayEvents(events);
  }

  async rebuildProjection(name: ProjectionName): Promise<void> {
    await this.projectionStore.clearProjection(name);
    await this.idempotencyTracker.clear();
    const eventTypes = PROJECTION_EVENT_MAP[name];
    const events = await this.eventStore.getAll();

    const filtered =
      eventTypes.includes('*')
        ? events
        : events.filter((e) => eventTypes.includes(e.eventType));

    await this.replayEvents(filtered);
  }

  private async replayEvents(events: DomainEvent<unknown>[]): Promise<void> {
    for (const event of events) {
      await this.router.route(event);
    }
  }
}

export { PROJECTION_EVENT_MAP };
