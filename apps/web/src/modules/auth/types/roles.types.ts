export type Role = 'ADMIN' | 'MANAGER' | 'MECHANIC' | 'FINANCIAL' | 'STOCKIST' | 'ATTENDANT'

export type AppPermission = 
  // Service Orders
  | 'os.create' | 'os.edit' | 'os.delete' | 'os.change_status' | 'os.assign'
  | 'os.approval_view' | 'os.approval_request' | 'os.approval_decide'
  // Inventory
  | 'stock.view' | 'stock.adjust' | 'stock.movement' | 'stock.cost.view'
  // Finance
  | 'invoice.create' | 'invoice.receive_payment' | 'invoice.discount' | 'invoice.cancel'

export const ROLE_PERMISSIONS: Record<Role, AppPermission[]> = {
  ADMIN: [
    'os.create', 'os.edit', 'os.delete', 'os.change_status', 'os.assign',
    'os.approval_view', 'os.approval_request', 'os.approval_decide',
    'stock.view', 'stock.adjust', 'stock.movement', 'stock.cost.view',
    'invoice.create', 'invoice.receive_payment', 'invoice.discount', 'invoice.cancel'
  ],
  MANAGER: [
    'os.create', 'os.edit', 'os.change_status', 'os.assign',
    'os.approval_view', 'os.approval_request', 'os.approval_decide',
    'stock.view', 'stock.adjust', 'stock.movement', 'stock.cost.view',
    'invoice.create', 'invoice.receive_payment', 'invoice.discount'
  ],
  MECHANIC: [
    'os.change_status',
    'os.approval_view',
    'stock.view'
  ],
  FINANCIAL: [
    'invoice.create', 'invoice.receive_payment', 'invoice.discount', 'invoice.cancel',
    'stock.view', 'os.change_status', 'os.approval_view'
  ],
  STOCKIST: [
    'stock.view', 'stock.adjust', 'stock.movement', 'os.approval_view'
  ],
  ATTENDANT: [
    'os.create', 'os.change_status',
    'os.approval_view', 'os.approval_request'
  ]
}
