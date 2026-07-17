export type CompletionBlockerCode =
  | 'INVALID_SERVICE_ORDER_STATUS'
  | 'APPROVAL_NOT_APPROVED'
  | 'APPROVAL_SNAPSHOT_MISMATCH'
  | 'DIAGNOSIS_MISSING'
  | 'SERVICE_MISSING'
  | 'SERVICE_NOT_COMPLETED'
  | 'SERVICE_SNAPSHOT_MISMATCH'
  | 'UNAPPROVED_SERVICE_PRESENT'
  | 'PART_MISSING'
  | 'PART_NOT_FULLY_CONSUMED'
  | 'PART_SNAPSHOT_MISMATCH'
  | 'UNAPPROVED_PART_PRESENT'
  | 'MOVEMENT_LEDGER_MISMATCH';

export interface CompletionBlocker {
  code: CompletionBlockerCode;
  message: string;
  entityId?: string;
}

export interface ServiceOrderCompletionReadiness {
  ready: boolean;
  completed?: boolean;
  blockers: CompletionBlocker[];
}
