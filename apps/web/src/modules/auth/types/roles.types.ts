export type Role = 'ADMIN' | 'MANAGER' | 'TECHNICIAN' | 'FINANCE' | 'STOCK_OPERATOR'

export type AppPermission = 
  // Service Orders
  | 'os.create' | 'os.edit' | 'os.delete' | 'os.change_status' | 'os.assign'
  // Inventory
  | 'stock.view' | 'stock.adjust' | 'stock.movement' | 'stock.cost.view'
  // Finance
  | 'invoice.create' | 'invoice.receive_payment' | 'invoice.discount' | 'invoice.cancel'

export const ROLE_PERMISSIONS: Record<Role, AppPermission[]> = {
  ADMIN: [
    'os.create', 'os.edit', 'os.delete', 'os.change_status', 'os.assign',
    'stock.view', 'stock.adjust', 'stock.movement', 'stock.cost.view',
    'invoice.create', 'invoice.receive_payment', 'invoice.discount', 'invoice.cancel'
  ],
  MANAGER: [
    'os.create', 'os.edit', 'os.change_status', 'os.assign',
    'stock.view', 'stock.adjust', 'stock.movement', 'stock.cost.view',
    'invoice.create', 'invoice.receive_payment', 'invoice.discount'
  ],
  TECHNICIAN: [
    'os.change_status',
    'stock.view'
  ],
  FINANCE: [
    'invoice.create', 'invoice.receive_payment', 'invoice.discount', 'invoice.cancel',
    'stock.view', 'os.change_status'
  ],
  STOCK_OPERATOR: [
    'stock.view', 'stock.adjust', 'stock.movement'
  ]
}
