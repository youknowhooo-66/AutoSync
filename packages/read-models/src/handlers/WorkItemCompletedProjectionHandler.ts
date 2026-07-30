import { WorkItemCompletedV1 } from '@autosync/domain';
import { ProjectionRegistry } from './ProjectionRegistry';
import { IProjectionStore } from '../repositories';

export class WorkItemCompletedProjectionHandler {
  constructor(
    private readonly registry: ProjectionRegistry,
    private readonly store: IProjectionStore,
  ) {}

  async handle(event: WorkItemCompletedV1): Promise<void> {
    const { workItemId, totalCost } = event.payload;

    const workItem = await this.store.workItemDashboard.get(workItemId);
    const maintenanceId = workItem?.maintenanceId;

    await this.registry.workItemDashboard.onWorkItemCompleted(
      workItemId,
      totalCost,
      event.eventId,
      event.timestamp,
    );

    if (maintenanceId) {
      await this.registry.maintenanceOverview.onWorkItemCompleted(
        maintenanceId,
        totalCost,
        event.eventId,
        event.timestamp,
      );
    }

    await this.registry.financialDashboard.onWorkItemCompleted(event);
    await this.registry.technicianProductivity.onWorkItemCompleted(event);
    await this.registry.vehicleHistory.onWorkItemCompleted(event);
    await this.registry.auditTrail.onDomainEvent(event);
  }
}
