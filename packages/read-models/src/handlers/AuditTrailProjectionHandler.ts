import { DomainEvent } from '@autosync/domain';
import { ProjectionRegistry } from './ProjectionRegistry';

export class AuditTrailProjectionHandler {
  constructor(private readonly registry: ProjectionRegistry) {}

  async handle(event: DomainEvent<unknown>): Promise<void> {
    await this.registry.auditTrail.onDomainEvent(event);
  }
}
