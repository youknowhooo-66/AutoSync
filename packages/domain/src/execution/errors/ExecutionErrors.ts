import { DomainError } from '../../shared/errors/DomainError';

export class TimeEntryIsImmutableError extends DomainError {
  constructor() {
    super('TechnicalTimeEntry is append-only and immutable. A new entry must be created instead.');
    this.name = 'TimeEntryIsImmutableError';
  }
}

export class EvidenceIsImmutableError extends DomainError {
  constructor() {
    super('Evidence is immutable after creation. It cannot be updated or deleted.');
    this.name = 'EvidenceIsImmutableError';
  }
}

export class InvalidTimeEntryError extends DomainError {
  constructor(msg: string) {
    super(`Invalid time entry: ${msg}`);
    this.name = 'InvalidTimeEntryError';
  }
}

export class AssignmentAlreadyExistsError extends DomainError {
  constructor(workItemId: string, userId: string) {
    super(`User "${userId}" already assigned to WorkItem "${workItemId}".`);
    this.name = 'AssignmentAlreadyExistsError';
  }
}
