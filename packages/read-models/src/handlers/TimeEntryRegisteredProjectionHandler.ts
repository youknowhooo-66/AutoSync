import { TimeEntryRegisteredV1 } from '@autosync/domain';
import { ProjectionRegistry } from './ProjectionRegistry';

export class TimeEntryRegisteredProjectionHandler {
  constructor(private readonly registry: ProjectionRegistry) {}

  async handle(event: TimeEntryRegisteredV1): Promise<void> {
    await this.registry.workItemDashboard.onTimeEntryRegistered(
      event.payload.workItemId,
      event.eventId,
      event.timestamp,
    );
    await this.registry.technicianProductivity.onTimeEntryRegistered(event);
    await this.registry.auditTrail.onDomainEvent(event);
  }
}
