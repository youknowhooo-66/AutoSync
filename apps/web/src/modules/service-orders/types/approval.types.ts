export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'INVALIDATED';
export type ApprovalMethod = 'ASSISTED' | 'CUSTOMER_PORTAL' | 'DIGITAL_SIGNATURE';

export interface ServiceOrderApproval {
  id: string;
  serviceOrderId: string;
  companyId: string;
  branchId: string;
  version: number;
  status: ApprovalStatus;
  snapshotVersion: number;
  snapshot: any; // BudgetApprovalSnapshot structure
  totalParts: string;
  totalServices: string;
  discount: string;
  finalValue: string;
  approvalMethod: ApprovalMethod;
  requestedAt: string;
  requestedById: string;
  approvedAt?: string;
  approvedById?: string;
  rejectedAt?: string;
  rejectedById?: string;
  rejectionReason?: string;
  invalidatedAt?: string;
  invalidatedById?: string;
  invalidationReason?: string;
  customerName?: string;
  customerDocument?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RequestApprovalPayload {
  serviceOrderId: string;
}

export interface ApproveServiceOrderPayload {
  serviceOrderId: string;
  approvalId: string;
}

export interface RejectServiceOrderPayload {
  serviceOrderId: string;
  approvalId: string;
  reason: string;
}

export interface InvalidateApprovalPayload {
  serviceOrderId: string;
  approvalId: string;
  reason: string;
}
