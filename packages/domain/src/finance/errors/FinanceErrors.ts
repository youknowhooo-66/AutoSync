import { DomainError } from '../../shared/errors/DomainError';

export class AccountAlreadyPaidError extends DomainError {
  constructor(accountId: string) {
    super(`Account "${accountId}" has already been paid.`);
    this.name = 'AccountAlreadyPaidError';
  }
}

export class AccountAlreadyCancelledError extends DomainError {
  constructor(accountId: string) {
    super(`Account "${accountId}" has already been cancelled.`);
    this.name = 'AccountAlreadyCancelledError';
  }
}

export class MeasurementAlreadyApprovedError extends DomainError {
  constructor(measurementId: string) {
    super(`Measurement "${measurementId}" has already been approved and cannot be modified.`);
    this.name = 'MeasurementAlreadyApprovedError';
  }
}

export class MeasurementValueMustBePositiveError extends DomainError {
  constructor() {
    super('Measurement totalValue must be a positive number.');
    this.name = 'MeasurementValueMustBePositiveError';
  }
}
