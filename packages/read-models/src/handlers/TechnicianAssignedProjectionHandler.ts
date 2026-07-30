import { TechnicalAssignmentCreatedV1 } from '@autosync/domain';
import { ProjectionRegistry } from './ProjectionRegistry';

/**
 * Maps domain event TechnicalAssignmentCreated to TechnicianAssigned projection.
 */
export class TechnicianAssignedProjectionHandler {
  constructor(private readonly registry: ProjectionRegistry) {}

  async handle(event: TechnicalAssignmentCreatedV1): Promise<void> {
    const { workItemId, userId } = event.payload;

    await this.registry.workItemDashboard.onTechnicianAssigned(
      workItemId,
      userId,
      event.eventId,
      event.timestamp,
    );
    await this.registry.auditTrail.onDomainEvent(event);
  }
}
