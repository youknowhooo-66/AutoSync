import { WorkItemCreatedV1 } from '@autosync/domain';
import { IProjectionStore } from '../../repositories';
import { IReferenceDataLookup } from '../shared/ReferenceDataLookup';
import { IProjectionIdempotencyTracker, withProjectionIdempotency } from '../shared/ProjectionIdempotency';
import { WorkItemDashboardView } from '../../views';

export class WorkItemDashboardProjector {
  constructor(
    private readonly store: IProjectionStore,
    private readonly referenceData: IReferenceDataLookup,
    private readonly idempotency: IProjectionIdempotencyTracker,
  ) {}

  async onWorkItemCreated(event: WorkItemCreatedV1): Promise<void> {
    await withProjectionIdempotency(
      this.idempotency,
      event.eventId,
      'WorkItemDashboard:onWorkItemCreated',
      async () => {
        const { workItemId, maintenanceId, description, estimatedCost } = event.payload;
        const context = this.referenceData.getMaintenanceContext(maintenanceId);
        const vehicleId = context?.vehicleId ?? '';
        const clientId = context?.clientId ?? '';
        const vehicle = this.referenceData.getVehicle(vehicleId);
        const client = this.referenceData.getClient(clientId);

        const view: WorkItemDashboardView = {
          workItemId,
          maintenanceId,
          companyId: event.companyId,
          vehicleId,
          vehiclePlate: vehicle?.plate ?? '',
          clientId,
          clientName: client?.name ?? '',
          description,
          status: 'PENDING',
          assignedTechnicianId: null,
          assignedTechnicianName: null,
          estimatedCost,
          actualCost: 0,
          evidenceCount: 0,
          startedAt: null,
          completedAt: null,
          createdAt: event.timestamp,
          updatedAt: event.timestamp,
        };

        await this.store.workItemDashboard.upsert(workItemId, view);
      },
    );
  }

  async onWorkItemApproved(workItemId: string, eventId: string, timestamp: Date): Promise<void> {
    await withProjectionIdempotency(
      this.idempotency,
      eventId,
      'WorkItemDashboard:onWorkItemApproved',
      async () => {
        const view = await this.store.workItemDashboard.get(workItemId);
        if (!view) return;

        await this.store.workItemDashboard.upsert(workItemId, {
          ...view,
          status: 'APPROVED',
          updatedAt: timestamp,
        });
      },
    );
  }

  async onTechnicianAssigned(
    workItemId: string,
    technicianId: string,
    eventId: string,
    timestamp: Date,
  ): Promise<void> {
    await withProjectionIdempotency(
      this.idempotency,
      eventId,
      'WorkItemDashboard:onTechnicianAssigned',
      async () => {
        const view = await this.store.workItemDashboard.get(workItemId);
        if (!view) return;

        const technician = this.referenceData.getTechnician(technicianId);
        this.referenceData.assignTechnicianToWorkItem({ workItemId, technicianId });

        await this.store.workItemDashboard.upsert(workItemId, {
          ...view,
          assignedTechnicianId: technicianId,
          assignedTechnicianName: technician?.name ?? null,
          updatedAt: timestamp,
        });
      },
    );
  }

  async onTimeEntryRegistered(workItemId: string, eventId: string, timestamp: Date): Promise<void> {
    await withProjectionIdempotency(
      this.idempotency,
      eventId,
      'WorkItemDashboard:onTimeEntryRegistered',
      async () => {
        const view = await this.store.workItemDashboard.get(workItemId);
        if (!view) return;

        await this.store.workItemDashboard.upsert(workItemId, {
          ...view,
          status: view.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
          startedAt: view.startedAt ?? timestamp,
          updatedAt: timestamp,
        });
      },
    );
  }

  async onEvidenceUploaded(workItemId: string, eventId: string, timestamp: Date): Promise<void> {
    await withProjectionIdempotency(
      this.idempotency,
      eventId,
      'WorkItemDashboard:onEvidenceUploaded',
      async () => {
        const view = await this.store.workItemDashboard.get(workItemId);
        if (!view) return;

        await this.store.workItemDashboard.upsert(workItemId, {
          ...view,
          evidenceCount: view.evidenceCount + 1,
          updatedAt: timestamp,
        });
      },
    );
  }

  async onWorkItemCompleted(
    workItemId: string,
    totalCost: number,
    eventId: string,
    timestamp: Date,
  ): Promise<void> {
    await withProjectionIdempotency(
      this.idempotency,
      eventId,
      'WorkItemDashboard:onWorkItemCompleted',
      async () => {
        const view = await this.store.workItemDashboard.get(workItemId);
        if (!view) return;

        await this.store.workItemDashboard.upsert(workItemId, {
          ...view,
          status: 'COMPLETED',
          actualCost: totalCost,
          completedAt: timestamp,
          updatedAt: timestamp,
        });
      },
    );
  }
}
