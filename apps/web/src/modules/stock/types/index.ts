export interface Part {
  id: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
}

export interface StockItem {
  id: string;
  partId: string;
  branchId: string;
  quantity: number;
  minimumStock: number;
  location?: string;
  part: Part;
  updatedAt: string;
}

export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER' | 'RETURN';

export interface StockMovement {
  id: string;
  partId: string;
  branchId: string;
  userId: string;
  type: MovementType;
  quantity: number;
  reason?: string;
  createdAt: string;
  part: {
    name: string;
  };
  user: {
    name: string;
  };
}

export interface StockSummary {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
}
