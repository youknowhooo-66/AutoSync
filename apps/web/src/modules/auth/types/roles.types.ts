export type Role = 'ADMIN' | 'MANAGER' | 'MECHANIC' | 'FINANCIAL' | 'STOCKIST' | 'ATTENDANT';

export type AppPermission =
  // Service Orders
  | 'os.create'
  | 'os.edit'
  | 'os.delete'
  | 'os.change_status'
  | 'os.assign'
  | 'os.approval_view'
  | 'os.approval_request'
  | 'os.approval_decide'
  // Inventory
  | 'stock.view'
  | 'stock.adjust'
  | 'stock.movement'
  | 'stock.cost.view'
  // Finance
  | 'invoice.create'
  | 'invoice.receive_payment'
  | 'invoice.discount'
  | 'invoice.cancel'
  | 'financial.view'
  | 'financial.manage'
  // Branch & Admin Management
  | 'branch.view'
  | 'branch.manage'
  | 'user.view'
  | 'user.manage'
  // Procurement & Notifications
  | 'service-orders.parts.request'
  | 'procurement.part-requests.read'
  | 'procurement.part-requests.start'
  | 'procurement.part-requests.purchase'
  | 'procurement.part-requests.receive'
  | 'procurement.part-requests.install'
  | 'procurement.part-requests.cancel'
  | 'notifications.read';

export const ROLE_PERMISSIONS: Record<Role, AppPermission[]> = {
  ADMIN: [
    'os.create',
    'os.edit',
    'os.delete',
    'os.change_status',
    'os.assign',
    'os.approval_view',
    'os.approval_request',
    'os.approval_decide',
    'stock.view',
    'stock.adjust',
    'stock.movement',
    'stock.cost.view',
    'invoice.create',
    'invoice.receive_payment',
    'invoice.discount',
    'invoice.cancel',
    'financial.view',
    'financial.manage',
    'branch.view',
    'branch.manage',
    'user.view',
    'user.manage',
    'service-orders.parts.request',
    'procurement.part-requests.read',
    'procurement.part-requests.start',
    'procurement.part-requests.purchase',
    'procurement.part-requests.receive',
    'procurement.part-requests.install',
    'procurement.part-requests.cancel',
    'notifications.read',
  ],
  MANAGER: [
    'os.create',
    'os.edit',
    'os.change_status',
    'os.assign',
    'os.approval_view',
    'os.approval_request',
    'os.approval_decide',
    'stock.view',
    'stock.adjust',
    'stock.movement',
    'stock.cost.view',
    'invoice.create',
    'invoice.receive_payment',
    'invoice.discount',
    'financial.view',
    'financial.manage',
    'branch.view',
    'user.view',
    'service-orders.parts.request',
    'procurement.part-requests.read',
    'procurement.part-requests.start',
    'procurement.part-requests.purchase',
    'procurement.part-requests.receive',
    'procurement.part-requests.install',
    'procurement.part-requests.cancel',
    'notifications.read',
  ],
  MECHANIC: [
    'os.change_status',
    'os.approval_view',
    'stock.view',
    'service-orders.parts.request',
    'procurement.part-requests.read',
    'procurement.part-requests.install',
    'procurement.part-requests.cancel',
    'notifications.read',
  ],
  FINANCIAL: [
    'invoice.create',
    'invoice.receive_payment',
    'invoice.discount',
    'invoice.cancel',
    'financial.view',
    'financial.manage',
    'stock.view',
    'os.change_status',
    'os.approval_view',
    'procurement.part-requests.read',
    'procurement.part-requests.start',
    'procurement.part-requests.purchase',
    'procurement.part-requests.cancel',
    'notifications.read',
  ],
  STOCKIST: [
    'stock.view',
    'stock.adjust',
    'stock.movement',
    'os.approval_view',
    'procurement.part-requests.read',
    'procurement.part-requests.receive',
    'notifications.read',
  ],
  ATTENDANT: [
    'os.create',
    'os.change_status',
    'os.approval_view',
    'os.approval_request',
    'service-orders.parts.request',
    'procurement.part-requests.read',
    'notifications.read',
  ],
};
