import { DomainError } from '../../shared/errors/DomainError';

export class VehicleTimelineIsMutableError extends DomainError {
  constructor() {
    super('VehicleTimeline is append-only. Existing entries cannot be modified or deleted.');
    this.name = 'VehicleTimelineIsMutableError';
  }
}

export class VehicleMustHaveClientError extends DomainError {
  constructor() {
    super('A Vehicle must belong to a Client.');
    this.name = 'VehicleMustHaveClientError';
  }
}

export class InvalidPlateError extends DomainError {
  constructor(plate: string) {
    super(`Invalid plate format: "${plate}"`);
    this.name = 'InvalidPlateError';
  }
}

export class ContractAlreadyExpiredError extends DomainError {
  constructor(contractId: string) {
    super(`Contract "${contractId}" has already expired.`);
    this.name = 'ContractAlreadyExpiredError';
  }
}

export class CommitmentExceedsContractValueError extends DomainError {
  constructor(contractId: string) {
    super(`Commitment value exceeds remaining contract value for contract "${contractId}".`);
    this.name = 'CommitmentExceedsContractValueError';
  }
}
