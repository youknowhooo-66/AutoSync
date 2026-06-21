import { MeasurementGeneratedV1 } from '@autosync/domain';
import { ProjectionRegistry } from './ProjectionRegistry';

export class MeasurementGeneratedProjectionHandler {
  constructor(private readonly registry: ProjectionRegistry) {}

  async handle(event: MeasurementGeneratedV1): Promise<void> {
    await this.registry.financialDashboard.onMeasurementGenerated(event);
    await this.registry.auditTrail.onDomainEvent(event);
  }
}
