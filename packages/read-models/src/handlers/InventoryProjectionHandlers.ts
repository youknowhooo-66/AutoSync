import { StockReservedV1, StockConsumedV1 } from '@autosync/domain';
import { StockReleasedV1, StockItemRegisteredV1 } from '../events/ProjectionEvents';
import { ProjectionRegistry } from './ProjectionRegistry';

export class StockReservedProjectionHandler {
  constructor(private readonly registry: ProjectionRegistry) {}

  async handle(event: StockReservedV1): Promise<void> {
    await this.registry.inventory.onStockReserved(event);
    await this.registry.auditTrail.onDomainEvent(event);
  }
}

export class StockReleasedProjectionHandler {
  constructor(private readonly registry: ProjectionRegistry) {}

  async handle(event: StockReleasedV1): Promise<void> {
    await this.registry.inventory.onStockReleased(event);
    await this.registry.auditTrail.onDomainEvent(event);
  }
}

export class StockConsumedProjectionHandler {
  constructor(private readonly registry: ProjectionRegistry) {}

  async handle(event: StockConsumedV1): Promise<void> {
    await this.registry.inventory.onStockConsumed(event);
    await this.registry.auditTrail.onDomainEvent(event);
  }
}

export class StockItemRegisteredProjectionHandler {
  constructor(private readonly registry: ProjectionRegistry) {}

  async handle(event: StockItemRegisteredV1): Promise<void> {
    await this.registry.inventory.onStockItemRegistered(event);
    await this.registry.auditTrail.onDomainEvent(event);
  }
}
