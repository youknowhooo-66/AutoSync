import { InvoiceIssuedV1 } from '@autosync/domain';
import { ProjectionRegistry } from './ProjectionRegistry';

export class InvoiceIssuedProjectionHandler {
  constructor(private readonly registry: ProjectionRegistry) {}

  async handle(event: InvoiceIssuedV1): Promise<void> {
    await this.registry.financialDashboard.onInvoiceIssued(event);
    await this.registry.vehicleHistory.onInvoiceIssued(event);
    await this.registry.auditTrail.onDomainEvent(event);
  }
}
