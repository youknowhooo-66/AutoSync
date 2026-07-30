/**
 * MaintenanceStatus — lifecycle of a Maintenance (Atendimento).
 * Follows the flow from DOMAIN_BLUEPRINT.md.
 */
export enum MaintenanceStatus {
  OPEN = 'OPEN',
  IN_DIAGNOSIS = 'IN_DIAGNOSIS',
  AWAITING_APPROVAL = 'AWAITING_APPROVAL',
  IN_EXECUTION = 'IN_EXECUTION',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * WorkItemStatus — lifecycle states for a WorkItem (unidade econômica).
 * State machine enforced inside Maintenance Aggregate.
 */
export enum WorkItemStatus {
  PENDING = 'PENDING',
  AWAITING_APPROVAL = 'AWAITING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  IN_EXECUTION = 'IN_EXECUTION',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * WorkItemType — categories of work (from ERD_DIAGRAM.md).
 */
export enum WorkItemType {
  MECHANIC = 'MECHANIC',
  PAINT = 'PAINT',
  ELECTRIC = 'ELECTRIC',
  BODYWORK = 'BODYWORK',
  FINISHING = 'FINISHING',
}

/**
 * ApprovalStatus — status of an approval decision on a WorkItem.
 */
export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

/**
 * MaintenanceRequestStatus — lifecycle of a maintenance request.
 */
export enum MaintenanceRequestStatus {
  OPEN = 'OPEN',
  SCHEDULED = 'SCHEDULED',
  ACCEPTED = 'ACCEPTED',
  CANCELLED = 'CANCELLED',
}

/**
 * MaintenanceRequestPriority — urgency levels.
 */
export enum MaintenanceRequestPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}
