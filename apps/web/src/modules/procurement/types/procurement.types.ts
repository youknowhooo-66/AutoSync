export type PurchaseRequestStatus =
  | 'REQUESTED'
  | 'IN_PROGRESS'
  | 'READY_FOR_PICKUP'
  | 'INSTALLED'
  | 'CANCELED';

export type PurchaseRequestPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface PurchaseRequestEvent {
  id: string;
  companyId: string;
  purchaseRequestId: string;
  actorId: string;
  actor?: {
    id: string;
    name: string;
    role: string;
  };
  type: string;
  fromStatus?: PurchaseRequestStatus | null;
  toStatus?: PurchaseRequestStatus | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  occurredAt: string;
}

export interface PurchaseRequest {
  id: string;
  companyId: string;
  branchId: string;
  serviceOrderId: string;
  createdBy: string;
  provisionalName: string;
  description?: string | null;
  quantity: string;
  requestedQuantity: string;
  purchasedQuantity?: string | null;
  unitPrice?: string | null;
  priority: PurchaseRequestPriority;
  mechanicNotes?: string | null;
  financialNote?: string | null;
  purchaseOrderRef?: string | null;
  expectedDeliveryAt?: string | null;
  supplierId?: string | null;
  partId?: string | null;
  stockId?: string | null;
  osPartId?: string | null;
  viewedById?: string | null;
  purchasedById?: string | null;
  receivedById?: string | null;
  installedById?: string | null;
  canceledById?: string | null;
  cancelReason?: string | null;
  viewedAt?: string | null;
  purchasedAt?: string | null;
  receivedAt?: string | null;
  readyForPickupAt?: string | null;
  installedAt?: string | null;
  canceledAt?: string | null;
  status: PurchaseRequestStatus;
  createdAt: string;
  updatedAt: string;

  createdByUser?: { id: string; name: string; email: string };
  viewedByUser?: { id: string; name: string; email: string };
  purchasedByUser?: { id: string; name: string; email: string };
  receivedByUser?: { id: string; name: string; email: string };
  installedByUser?: { id: string; name: string; email: string };
  supplier?: { id: string; name: string };
  part?: { id: string; name: string; internalCode: string };
  events?: PurchaseRequestEvent[];
}

export interface CreatePartRequestInput {
  serviceOrderId: string;
  provisionalName: string;
  requestedQuantity: string;
  mechanicNotes?: string;
  priority?: PurchaseRequestPriority;
  expectedDeliveryAt?: string;
}

export interface RegisterPurchaseInput {
  definitiveName: string;
  suggestedInternalCode?: string;
  brand?: string;
  purchasedQuantity: string;
  unitPrice: string;
  supplierId: string;
  purchaseOrderRef?: string;
  expectedDeliveryAt?: string;
  financialNote?: string;
}

export interface ReceivePartInput {
  partName?: string;
  internalCode?: string;
  brand?: string;
  receivedQuantity: string;
  unitPrice?: string;
}

export interface InstallPartInput {
  installedQuantity?: string;
}

export interface CancelPartRequestInput {
  cancelReason: string;
}

export interface PurchaseRequestFilters {
  serviceOrderId?: string;
  status?: PurchaseRequestStatus;
  priority?: PurchaseRequestPriority;
}

export interface NotificationItem {
  id: string;
  companyId: string;
  recipientId: string;
  type: string;
  title: string;
  message?: string | null;
  entityType: 'PurchaseRequest' | 'ServiceOrder';
  entityId: string;
  readAt?: string | null;
  createdAt: string;
  branchId?: string;
}

export interface NotificationListResponse {
  notifications: NotificationItem[];
  unreadCount: number;
}
