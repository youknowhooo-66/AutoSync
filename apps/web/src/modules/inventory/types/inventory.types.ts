export type StockStatus = 'OK' | 'LOW' | 'CRITICAL' | 'OUT_OF_STOCK'
export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN'
export type MovementSource = 'OS' | 'PURCHASE' | 'MANUAL' | 'RETURN'

export interface InventoryItem {
  id: string
  name: string
  internalCode: string
  category: string
  brand: string
  salePrice: number
  purchasePrice: number
  minStock: number
  location?: string
  supplierId?: string
  stocks: { 
    quantity: number
    branchId: string
    branch?: { name: string } 
  }[]
  // Derived/computed fields for the UI
  totalQuantity: number
  status: StockStatus
}

export interface InventoryMovement {
  id: string
  inventoryItemId: string
  type: MovementType
  quantity: number
  source: MovementSource
  referenceId?: string
  createdAt: string
  createdBy: string
}
