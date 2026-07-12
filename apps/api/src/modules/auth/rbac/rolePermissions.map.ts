import { Role, Permission } from './permissions';

export const rolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: Object.values(Permission), // Admin has everything
  
  [Role.MANAGER]: [
    Permission.SERVICE_ORDER_VIEW,
    Permission.SERVICE_ORDER_CREATE,
    Permission.SERVICE_ORDER_START,
    Permission.SERVICE_ORDER_COMPLETE,
    Permission.SERVICE_ORDER_CANCEL,
    Permission.STOCK_VIEW,
    Permission.STOCK_UPDATE,
    Permission.FINANCIAL_VIEW,
    Permission.AUDIT_VIEW,
    Permission.USER_MANAGE,
  ],

  [Role.MECHANIC]: [
    Permission.SERVICE_ORDER_VIEW,
    Permission.SERVICE_ORDER_START,
    Permission.SERVICE_ORDER_COMPLETE,
    Permission.STOCK_VIEW,
  ],

  [Role.FINANCIAL]: [
    Permission.SERVICE_ORDER_VIEW,
    Permission.FINANCIAL_VIEW,
    Permission.FINANCIAL_CREATE,
    Permission.AUDIT_VIEW,
  ],

  [Role.ATTENDANT]: [
    Permission.SERVICE_ORDER_VIEW,
    Permission.SERVICE_ORDER_CREATE,
    Permission.STOCK_VIEW,
  ],

  [Role.STOCKIST]: [
    Permission.STOCK_VIEW,
    Permission.STOCK_UPDATE,
  ],
};
