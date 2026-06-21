import { DomainError } from '../../shared/errors/DomainError';

export class MaintenanceCannotFinalizeError extends DomainError {
  constructor(pendingItems: number) {
    super(
      `Cannot finalize Maintenance: ${pendingItems} WorkItem(s) are neither approved nor rejected.`,
    );
    this.name = 'MaintenanceCannotFinalizeError';
  }
}

export class WorkItemNotFoundInMaintenanceError extends DomainError {
  constructor(workItemId: string) {
    super(`WorkItem "${workItemId}" does not belong to this Maintenance.`);
    this.name = 'WorkItemNotFoundInMaintenanceError';
  }
}

export class WorkItemCannotTransitionError extends DomainError {
  constructor(workItemId: string, from: string, to: string) {
    super(`WorkItem "${workItemId}" cannot transition from "${from}" to "${to}".`);
    this.name = 'WorkItemCannotTransitionError';
  }
}

export class ApprovalAlreadyExistsForWorkItemError extends DomainError {
  constructor(workItemId: string) {
    super(`An Approval decision already exists for WorkItem "${workItemId}".`);
    this.name = 'ApprovalAlreadyExistsForWorkItemError';
  }
}

export class MaintenanceAlreadyClosedError extends DomainError {
  constructor(maintenanceId: string) {
    super(`Maintenance "${maintenanceId}" is already closed (COMPLETED or CANCELLED).`);
    this.name = 'MaintenanceAlreadyClosedError';
  }
}

export class WorkItemMustBelongToMaintenanceError extends DomainError {
  constructor() {
    super('A WorkItem cannot exist without a parent Maintenance.');
    this.name = 'WorkItemMustBelongToMaintenanceError';
  }
}

export class InvalidWorkItemTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super(`Invalid WorkItem status transition: "${from}" → "${to}".`);
    this.name = 'InvalidWorkItemTransitionError';
  }
}
