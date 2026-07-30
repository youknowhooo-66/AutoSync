import { WorkItemCreatedV1 } from '@autosync/domain';
import { ProjectionRegistry } from './ProjectionRegistry';

export class WorkItemCreatedProjectionHandler {
  constructor(private readonly registry: ProjectionRegistry) {}

  async handle(event: WorkItemCreatedV1): Promise<void> {
    await this.registry.workItemDashboard.onWorkItemCreated(event);
    await this.registry.maintenanceOverview.onWorkItemCreated(event);
    await this.registry.auditTrail.onDomainEvent(event);
  }
}
