export type ServiceOrderFinanceStatus =
  | 'NOT_ELIGIBLE'
  | 'NOT_REQUIRED'
  | 'NOT_GENERATED'
  | 'GENERATED';

export type ServiceOrderFinanceReason =
  | 'SERVICE_ORDER_NOT_FINISHED'
  | 'APPROVAL_NOT_FOUND'
  | 'LATEST_APPROVAL_NOT_APPROVED'
  | 'ZERO_VALUE';

export interface ServiceOrderFinanceState {
  status: ServiceOrderFinanceStatus;
  reason?: ServiceOrderFinanceReason;
  totalParts?: string;
  totalServices?: string;
  discount?: string;
  finalValue?: string;
  receivable?: {
    id: string;
    amount: string;
    status: string;
    dueDate: string;
    createdAt: string;
  };
}

export interface GenerateServiceOrderReceivableDTO {
  dueDate: string;
}
