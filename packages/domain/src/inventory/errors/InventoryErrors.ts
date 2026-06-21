import { DomainError } from '../../shared/errors/DomainError';

export class InsufficientStockError extends DomainError {
  constructor(stockItemId: string, requested: number, available: number) {
    super(
      `Insufficient stock for item "${stockItemId}": requested ${requested}, available ${available}.`,
    );
    this.name = 'InsufficientStockError';
  }
}

export class StockMovementIsImmutableError extends DomainError {
  constructor() {
    super('StockMovement is append-only. Existing movements cannot be modified or deleted.');
    this.name = 'StockMovementIsImmutableError';
  }
}

export class StockReservationAlreadyReleasedError extends DomainError {
  constructor(reservationId: string) {
    super(`StockReservation "${reservationId}" has already been released.`);
    this.name = 'StockReservationAlreadyReleasedError';
  }
}

export class StockReservationConflictError extends DomainError {
  constructor(stockItemId: string, workItemId: string) {
    super(
      `A StockReservation for StockItem "${stockItemId}" on WorkItem "${workItemId}" already exists.`,
    );
    this.name = 'StockReservationConflictError';
  }
}
