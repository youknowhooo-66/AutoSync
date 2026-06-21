import { EvidenceUploadedV1 } from '@autosync/domain';
import { ProjectionRegistry } from './ProjectionRegistry';

export class EvidenceUploadedProjectionHandler {
  constructor(private readonly registry: ProjectionRegistry) {}

  async handle(event: EvidenceUploadedV1): Promise<void> {
    await this.registry.workItemDashboard.onEvidenceUploaded(
      event.payload.workItemId,
      event.eventId,
      event.timestamp,
    );
    await this.registry.auditTrail.onDomainEvent(event);
  }
}
