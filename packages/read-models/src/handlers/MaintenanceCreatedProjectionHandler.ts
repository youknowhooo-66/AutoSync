import { MaintenanceCreatedV1 } from '@autosync/domain';
import { ProjectionRegistry } from './ProjectionRegistry';

export class MaintenanceCreatedProjectionHandler {
  constructor(private readonly registry: ProjectionRegistry) {}

  async handle(event: MaintenanceCreatedV1): Promise<void> {
    await this.registry.maintenanceOverview.onMaintenanceCreated(event);
    await this.registry.vehicleHistory.onMaintenanceCreated(event);
    await this.registry.auditTrail.onDomainEvent(event);
  }
}
