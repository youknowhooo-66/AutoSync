/**
 * MovementType — direction of a StockMovement.
 * Source: ERD_DIAGRAM.md — StockMovement.type enum.
 */
export enum MovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUST = 'ADJUST',
}

/**
 * ReservationStatus — lifecycle of a StockReservation.
 */
export enum ReservationStatus {
  ACTIVE = 'ACTIVE',
  CONSUMED = 'CONSUMED',
  RELEASED = 'RELEASED',
}
