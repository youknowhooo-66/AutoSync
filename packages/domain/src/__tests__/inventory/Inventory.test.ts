import { describe, it, expect, beforeEach } from 'vitest';
import { StockItem } from '../../inventory/aggregates/StockItem';
import { MovementType, ReservationStatus } from '../../inventory/value-objects/InventoryEnums';
import {
  InsufficientStockError,
  StockReservationConflictError,
  StockReservationAlreadyReleasedError,
} from '../../inventory/errors/InventoryErrors';

describe('Inventory Aggregate', () => {
  const companyId = 'company-123';
  let stockItem: StockItem;

  beforeEach(() => {
    stockItem = StockItem.create({
      companyId,
      name: 'Brake Pad',
      initialQuantity: 10,
      unitPrice: 50.0,
    });
  });

  it('should correctly receive stock and append a Movement', () => {
    stockItem.receive(5, 'purchase-123');

    expect(stockItem.quantity).toBe(15);
    expect(stockItem.movements.length).toBe(1);
    expect(stockItem.movements[0].type).toBe(MovementType.IN);
    expect(stockItem.movements[0].quantity).toBe(5);
  });

  it('should reserve stock successfully', () => {
    const reservation = stockItem.reserve({
      workItemId: 'wi-1',
      quantity: 4,
      correlationId: 'corr-1',
    });

    expect(reservation.status).toBe(ReservationStatus.ACTIVE);
    expect(stockItem.reservedQuantity).toBe(4);
    expect(stockItem.availableQuantity).toBe(6);

    // Event should be emitted
    expect(stockItem.domainEvents.length).toBe(1);
    expect(stockItem.domainEvents[0].eventType).toBe('StockReserved');
  });

  it('should block reserving more stock than available', () => {
    expect(() =>
      stockItem.reserve({
        workItemId: 'wi-1',
        quantity: 11, // only 10 available
        correlationId: 'corr-1',
      }),
    ).toThrow(InsufficientStockError);
  });

  it('should prevent double allocation for the same WorkItem', () => {
    stockItem.reserve({
      workItemId: 'wi-1',
      quantity: 2,
      correlationId: 'corr-1',
    });

    expect(() =>
      stockItem.reserve({
        workItemId: 'wi-1', // same WorkItem
        quantity: 2,
        correlationId: 'corr-2',
      }),
    ).toThrow(StockReservationConflictError);
  });

  it('should correctly consume reserved stock', () => {
    const reservation = stockItem.reserve({
      workItemId: 'wi-1',
      quantity: 4,
      correlationId: 'corr-1',
    });

    // Clear events
    stockItem.clearEvents();

    stockItem.consume({
      workItemId: 'wi-1',
      quantity: 4,
      correlationId: 'corr-2',
    });

    expect(stockItem.quantity).toBe(6);
    expect(stockItem.availableQuantity).toBe(6);
    expect(reservation.status).toBe(ReservationStatus.CONSUMED);
    expect(stockItem.movements.length).toBe(1);
    expect(stockItem.movements[0].type).toBe(MovementType.OUT);

    expect(stockItem.domainEvents.length).toBe(1);
    expect(stockItem.domainEvents[0].eventType).toBe('StockConsumed');
  });

  it('should throw an error when releasing an already released/consumed reservation', () => {
    const reservation = stockItem.reserve({
      workItemId: 'wi-1',
      quantity: 4,
      correlationId: 'corr-1',
    });

    reservation.release();

    expect(() => reservation.release()).toThrow(StockReservationAlreadyReleasedError);
    expect(() => reservation.consume()).toThrow(StockReservationAlreadyReleasedError);
  });
});
