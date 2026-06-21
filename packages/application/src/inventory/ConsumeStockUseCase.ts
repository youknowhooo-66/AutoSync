import { IInventoryRepository } from './IInventoryRepository';
import { IEventBus } from '../shared/IEventBus';

export interface ConsumeStockInputDTO {
  stockItemId: string;
  workItemId: string;
  quantity: number;
  correlationId: string;
}

export class ConsumeStockUseCase {
  constructor(
    private readonly inventoryRepo: IInventoryRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: ConsumeStockInputDTO): Promise<void> {
    const stockItem = await this.inventoryRepo.findById(input.stockItemId);
    if (!stockItem) {
      throw new Error(`StockItem "${input.stockItemId}" not found`);
    }

    // Domínio: Converte reserva em Movement (OUT).
    stockItem.consume({
      workItemId: input.workItemId,
      quantity: input.quantity,
      correlationId: input.correlationId,
    });

    await this.inventoryRepo.save(stockItem);

    // Emite StockConsumed.v1
    await this.eventBus.dispatchAll(stockItem.domainEvents);
    stockItem.clearEvents();
  }
}
