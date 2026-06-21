import { Entity } from '../../shared/Entity';
import { UniqueEntityId } from '../../shared/UniqueEntityId';
import { ReservationStatus } from '../value-objects/InventoryEnums';
import {
  StockReservationAlreadyReleasedError,
} from '../errors/InventoryErrors';

export interface StockReservationProps {
  readonly stockItemId: UniqueEntityId;
  readonly workItemId: UniqueEntityId;
  readonly quantity: number;
  readonly status: ReservationStatus;
}

/**
 * StockReservation — prevents double-allocation of inventory.
 *
 * Rules (aggregates-design.md):
 *   - Reservation prevents consumption conflicts
 *   - Never directly mutated via external calls
 *   - Can be released (returned) or consumed (used)
 *
 * Rules (domain-prisma-mapping.md): Reservation expires or is released.
 */
export class StockReservation extends Entity<StockReservationProps> {
  private _status: ReservationStatus;

  private constructor(props: StockReservationProps, id?: UniqueEntityId) {
    super(props, id);
    this._status = props.status;
  }

  get stockItemId(): UniqueEntityId { return this._props.stockItemId; }
  get workItemId(): UniqueEntityId { return this._props.workItemId; }
  get quantity(): number { return this._props.quantity; }
  get status(): ReservationStatus { return this._status; }

  isActive(): boolean {
    return this._status === ReservationStatus.ACTIVE;
  }

  /**
   * Releases the reservation back to available stock.
   * Invariant: cannot release an already-released reservation.
   */
  release(): void {
    if (!this.isActive()) {
      throw new StockReservationAlreadyReleasedError(this._id.value);
    }
    this._status = ReservationStatus.RELEASED;
  }

  /**
   * Marks the reservation as consumed (stock physically used).
   * Invariant: cannot consume an already-released reservation.
   */
  consume(): void {
    if (!this.isActive()) {
      throw new StockReservationAlreadyReleasedError(this._id.value);
    }
    this._status = ReservationStatus.CONSUMED;
  }

  static create(
    props: { stockItemId: string; workItemId: string; quantity: number },
    id?: UniqueEntityId,
  ): StockReservation {
    return new StockReservation(
      {
        stockItemId: new UniqueEntityId(props.stockItemId),
        workItemId: new UniqueEntityId(props.workItemId),
        quantity: props.quantity,
        status: ReservationStatus.ACTIVE,
      },
      id,
    );
  }

  static reconstitute(props: StockReservationProps, id: UniqueEntityId): StockReservation {
    return new StockReservation(props, id);
  }
}
