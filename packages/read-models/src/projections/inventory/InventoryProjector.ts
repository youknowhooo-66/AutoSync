import { StockReservedV1, StockConsumedV1 } from '@autosync/domain';
import { StockReleasedV1, StockItemRegisteredV1 } from '../../events/ProjectionEvents';
import { IProjectionStore } from '../../repositories';
import { IProjectionIdempotencyTracker, withProjectionIdempotency } from '../shared/ProjectionIdempotency';
import { InventoryProjectionView } from '../../views';

export class InventoryProjector {
  constructor(
    private readonly store: IProjectionStore,
    private readonly idempotency: IProjectionIdempotencyTracker,
  ) {}

  async onStockItemRegistered(event: StockItemRegisteredV1): Promise<void> {
    await withProjectionIdempotency(
      this.idempotency,
      event.eventId,
      'Inventory:onStockItemRegistered',
      async () => {
        const { stockItemId, sku, description, initialQuantity } = event.payload;

        const view: InventoryProjectionView = {
          stockItemId,
          companyId: event.companyId,
          sku,
          description,
          availableQuantity: initialQuantity,
          reservedQuantity: 0,
          consumedQuantity: 0,
          lastMovementAt: event.timestamp,
        };

        await this.store.inventory.upsert(stockItemId, view);
      },
    );
  }

  async onStockReserved(event: StockReservedV1): Promise<void> {
    await withProjectionIdempotency(
      this.idempotency,
      event.eventId,
      'Inventory:onStockReserved',
      async () => {
        const { stockItemId, quantity } = event.payload;
        const view = await this.getOrCreate(stockItemId, event.companyId, event.timestamp);

        await this.store.inventory.upsert(stockItemId, {
          ...view,
          availableQuantity: Math.max(0, view.availableQuantity - quantity),
          reservedQuantity: view.reservedQuantity + quantity,
          lastMovementAt: event.timestamp,
        });
      },
    );
  }

  async onStockReleased(event: StockReleasedV1): Promise<void> {
    await withProjectionIdempotency(
      this.idempotency,
      event.eventId,
      'Inventory:onStockReleased',
      async () => {
        const { stockItemId, quantity } = event.payload;
        const view = await this.getOrCreate(stockItemId, event.companyId, event.timestamp);

        await this.store.inventory.upsert(stockItemId, {
          ...view,
          availableQuantity: view.availableQuantity + quantity,
          reservedQuantity: Math.max(0, view.reservedQuantity - quantity),
          lastMovementAt: event.timestamp,
        });
      },
    );
  }

  async onStockConsumed(event: StockConsumedV1): Promise<void> {
    await withProjectionIdempotency(
      this.idempotency,
      event.eventId,
      'Inventory:onStockConsumed',
      async () => {
        const { stockItemId, quantity } = event.payload;
        const view = await this.getOrCreate(stockItemId, event.companyId, event.timestamp);

        await this.store.inventory.upsert(stockItemId, {
          ...view,
          reservedQuantity: Math.max(0, view.reservedQuantity - quantity),
          consumedQuantity: view.consumedQuantity + quantity,
          lastMovementAt: event.timestamp,
        });
      },
    );
  }

  private async getOrCreate(
    stockItemId: string,
    companyId: string,
    timestamp: Date,
  ): Promise<InventoryProjectionView> {
    const existing = await this.store.inventory.get(stockItemId);
    if (existing) return existing;

    return {
      stockItemId,
      companyId,
      sku: '',
      description: '',
      availableQuantity: 0,
      reservedQuantity: 0,
      consumedQuantity: 0,
      lastMovementAt: timestamp,
    };
  }
}
