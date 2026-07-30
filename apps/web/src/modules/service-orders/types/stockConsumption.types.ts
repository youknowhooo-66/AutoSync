export interface ServiceOrderPartConsumption {
  partId: string; // OSPart ID
  realPartId: string; // database Part ID
  name: string;
  sku: string;
  plannedQuantity: number;
  consumedQuantity: number;
  remainingQuantity: number;
  availableStock: number;
  movements: Array<{
    id: string;
    quantity: number;
    performedById: string;
    performedByName: string;
    createdAt: string;
  }>;
}
