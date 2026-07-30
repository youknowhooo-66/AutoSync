import { MaintenanceCreatedV1, WorkItemCompletedV1, InvoiceIssuedV1 } from '@autosync/domain';
import { IProjectionStore } from '../../repositories';
import { IReferenceDataLookup } from '../shared/ReferenceDataLookup';
import { IProjectionIdempotencyTracker, withProjectionIdempotency } from '../shared/ProjectionIdempotency';
import { VehicleHistoryView, VehicleTimelineEntry } from '../../views';

export class VehicleHistoryProjector {
  constructor(
    private readonly store: IProjectionStore,
    private readonly referenceData: IReferenceDataLookup,
    private readonly idempotency: IProjectionIdempotencyTracker,
  ) {}

  async onMaintenanceCreated(event: MaintenanceCreatedV1): Promise<void> {
    await withProjectionIdempotency(
      this.idempotency,
      event.eventId,
      'VehicleHistory:onMaintenanceCreated',
      async () => {
        const { maintenanceId, vehicleId } = event.payload;
        const view = await this.getOrCreate(vehicleId, event.companyId, event.timestamp);

        const entry: VehicleTimelineEntry = {
          date: event.timestamp,
          type: 'MAINTENANCE',
          description: `Manutenção ${maintenanceId} aberta`,
          referenceId: maintenanceId,
        };

        await this.store.vehicleHistory.upsert(vehicleId, {
          ...view,
          totalMaintenances: view.totalMaintenances + 1,
          lastMaintenanceDate: event.timestamp,
          timeline: [...view.timeline, entry],
          updatedAt: event.timestamp,
        });
      },
    );
  }

  async onWorkItemCompleted(event: WorkItemCompletedV1): Promise<void> {
    await withProjectionIdempotency(
      this.idempotency,
      event.eventId,
      'VehicleHistory:onWorkItemCompleted',
      async () => {
        const { workItemId, totalCost } = event.payload;
        const vehicleId = await this.resolveVehicleForWorkItem(workItemId);
        if (!vehicleId) return;

        const view = await this.getOrCreate(vehicleId, event.companyId, event.timestamp);
        const entry: VehicleTimelineEntry = {
          date: event.timestamp,
          type: 'WORK_ITEM_COMPLETED',
          description: `Work item ${workItemId} concluído`,
          value: totalCost,
          referenceId: workItemId,
        };

        await this.store.vehicleHistory.upsert(vehicleId, {
          ...view,
          totalSpent: view.totalSpent + totalCost,
          timeline: [...view.timeline, entry],
          updatedAt: event.timestamp,
        });
      },
    );
  }

  async onInvoiceIssued(event: InvoiceIssuedV1): Promise<void> {
    await withProjectionIdempotency(
      this.idempotency,
      event.eventId,
      'VehicleHistory:onInvoiceIssued',
      async () => {
        const vehicleId = await this.resolveVehicleForReference(event.payload.referenceId);
        if (!vehicleId) return;

        const view = await this.getOrCreate(vehicleId, event.companyId, event.timestamp);
        const entry: VehicleTimelineEntry = {
          date: event.timestamp,
          type: 'INVOICE',
          description: `Nota fiscal ${event.payload.invoiceId} emitida`,
          referenceId: event.payload.invoiceId,
        };

        await this.store.vehicleHistory.upsert(vehicleId, {
          ...view,
          timeline: [...view.timeline, entry],
          updatedAt: event.timestamp,
        });
      },
    );
  }

  private async resolveVehicleForWorkItem(workItemId: string): Promise<string | null> {
    const workItems = await this.store.workItemDashboard.findBy(
      (w) => w.workItemId === workItemId,
    );
    if (workItems.length > 0) return workItems[0].vehicleId;

    return null;
  }

  private async resolveVehicleForReference(referenceId: string): Promise<string | null> {
    const vehicleId = this.referenceData.getVehicleForMaintenance(referenceId);
    if (vehicleId) return vehicleId;

    const workItems = await this.store.workItemDashboard.findBy(
      (w) => w.workItemId === referenceId,
    );
    if (workItems.length > 0) return workItems[0].vehicleId;

    return null;
  }

  private async getOrCreate(
    vehicleId: string,
    companyId: string,
    timestamp: Date,
  ): Promise<VehicleHistoryView> {
    const existing = await this.store.vehicleHistory.get(vehicleId);
    if (existing) return existing;

    return {
      vehicleId,
      companyId,
      totalMaintenances: 0,
      totalSpent: 0,
      lastMaintenanceDate: null,
      timeline: [],
      updatedAt: timestamp,
    };
  }
}
