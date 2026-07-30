import { StockReservedV1 } from '@autosync/domain';

export class StockReservedHandler {
  async handle(event: StockReservedV1): Promise<void> {
    // Audit trail only
    const { stockItemId, quantity, workItemId } = event.payload;
    console.log(`[AUDIT] Stock Reserved: ${quantity} units of ${stockItemId} for WorkItem ${workItemId}`);
  }
}
