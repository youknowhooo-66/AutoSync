import { MaintenanceCreatedV1, WorkItemCreatedV1 } from '@autosync/domain';
import { IProjectionStore } from '../../repositories';
import { IReferenceDataLookup } from '../shared/ReferenceDataLookup';
import { IProjectionIdempotencyTracker, withProjectionIdempotency } from '../shared/ProjectionIdempotency';
import { MaintenanceOverviewView, MaintenanceStatus } from '../../views';

export class MaintenanceOverviewProjector {
  constructor(
    private readonly store: IProjectionStore,
    private readonly referenceData: IReferenceDataLookup,
    private readonly idempotency: IProjectionIdempotencyTracker,
  ) {}

  async onMaintenanceCreated(event: MaintenanceCreatedV1): Promise<void> {
    await withProjectionIdempotency(
      this.idempotency,
      event.eventId,
      'MaintenanceOverview:onMaintenanceCreated',
      async () => {
        const { maintenanceId, clientId, vehicleId } = event.payload;

        this.referenceData.saveMaintenanceContext({
          maintenanceId,
          companyId: event.companyId,
          clientId,
          vehicleId,
        });

        const vehicle = this.referenceData.getVehicle(vehicleId);
        const client = this.referenceData.getClient(clientId);

        const view: MaintenanceOverviewView = {
          maintenanceId,
          companyId: event.companyId,
          vehicleId,
          vehiclePlate: vehicle?.plate ?? '',
          clientId,
          clientName: client?.name ?? '',
          totalWorkItems: 0,
          pendingWorkItems: 0,
          approvedWorkItems: 0,
          completedWorkItems: 0,
          estimatedValue: 0,
          actualValue: 0,
          status: 'OPEN',
          createdAt: event.timestamp,
          updatedAt: event.timestamp,
        };

        await this.store.maintenanceOverview.upsert(maintenanceId, view);
      },
    );
  }

  async onWorkItemCreated(event: WorkItemCreatedV1): Promise<void> {
    await withProjectionIdempotency(
      this.idempotency,
      event.eventId,
      'MaintenanceOverview:onWorkItemCreated',
      async () => {
        const { maintenanceId, estimatedCost } = event.payload;
        const view = await this.store.maintenanceOverview.get(maintenanceId);
        if (!view) return;

        await this.store.maintenanceOverview.upsert(maintenanceId, {
          ...view,
          totalWorkItems: view.totalWorkItems + 1,
          pendingWorkItems: view.pendingWorkItems + 1,
          estimatedValue: view.estimatedValue + estimatedCost,
          status: this.resolveStatus(view.completedWorkItems, view.totalWorkItems + 1),
          updatedAt: event.timestamp,
        });
      },
    );
  }

  async onWorkItemApproved(maintenanceId: string, eventId: string, timestamp: Date): Promise<void> {
    await withProjectionIdempotency(
      this.idempotency,
      eventId,
      'MaintenanceOverview:onWorkItemApproved',
      async () => {
        const view = await this.store.maintenanceOverview.get(maintenanceId);
        if (!view) return;

        await this.store.maintenanceOverview.upsert(maintenanceId, {
          ...view,
          pendingWorkItems: Math.max(0, view.pendingWorkItems - 1),
          approvedWorkItems: view.approvedWorkItems + 1,
          status: 'IN_PROGRESS',
          updatedAt: timestamp,
        });
      },
    );
  }

  async onWorkItemCompleted(
    maintenanceId: string,
    totalCost: number,
    eventId: string,
    timestamp: Date,
  ): Promise<void> {
    await withProjectionIdempotency(
      this.idempotency,
      eventId,
      'MaintenanceOverview:onWorkItemCompleted',
      async () => {
        const view = await this.store.maintenanceOverview.get(maintenanceId);
        if (!view) return;

        const completedWorkItems = view.completedWorkItems + 1;
        const approvedWorkItems = Math.max(0, view.approvedWorkItems - 1);

        await this.store.maintenanceOverview.upsert(maintenanceId, {
          ...view,
          approvedWorkItems,
          completedWorkItems,
          actualValue: view.actualValue + totalCost,
          status: this.resolveStatus(completedWorkItems, view.totalWorkItems),
          updatedAt: timestamp,
        });
      },
    );
  }

  private resolveStatus(completed: number, total: number): MaintenanceStatus {
    if (total === 0) return 'OPEN';
    if (completed >= total) return 'COMPLETED';
    if (completed > 0) return 'IN_PROGRESS';
    return 'OPEN';
  }
}
