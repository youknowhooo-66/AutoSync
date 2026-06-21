import { WorkItemApprovedV1 } from '@autosync/domain';
import { ProjectionRegistry } from './ProjectionRegistry';

export class WorkItemApprovedProjectionHandler {
  constructor(private readonly registry: ProjectionRegistry) {}

  async handle(event: WorkItemApprovedV1): Promise<void> {
    const { workItemId, maintenanceId } = event.payload;

    await this.registry.workItemDashboard.onWorkItemApproved(workItemId, event.eventId, event.timestamp);
    await this.registry.maintenanceOverview.onWorkItemApproved(maintenanceId, event.eventId, event.timestamp);
    await this.registry.auditTrail.onDomainEvent(event);
  }
}
