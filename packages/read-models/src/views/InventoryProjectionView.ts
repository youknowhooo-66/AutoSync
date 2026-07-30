export interface InventoryProjectionView {
  stockItemId: string;
  companyId: string;
  sku: string;
  description: string;
  availableQuantity: number;
  reservedQuantity: number;
  consumedQuantity: number;
  lastMovementAt: Date | null;
}
