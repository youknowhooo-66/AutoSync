import {
  AccountReceivableCreatedV1,
  AccountPayableCreatedV1,
} from '../events/ProjectionEvents';
import { ProjectionRegistry } from './ProjectionRegistry';

export class AccountReceivableCreatedProjectionHandler {
  constructor(private readonly registry: ProjectionRegistry) {}

  async handle(event: AccountReceivableCreatedV1): Promise<void> {
    await this.registry.financialDashboard.onAccountReceivableCreated(event);
    await this.registry.auditTrail.onDomainEvent(event);
  }
}

export class AccountPayableCreatedProjectionHandler {
  constructor(private readonly registry: ProjectionRegistry) {}

  async handle(event: AccountPayableCreatedV1): Promise<void> {
    await this.registry.financialDashboard.onAccountPayableCreated(event);
    await this.registry.auditTrail.onDomainEvent(event);
  }
}
