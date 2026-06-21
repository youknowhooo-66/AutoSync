import { AggregateRoot } from '../../shared/AggregateRoot';
import { UniqueEntityId } from '../../shared/UniqueEntityId';
import { StockMovement } from '../entities/StockMovement';
import { StockReservation } from '../entities/StockReservation';
import { MovementType } from '../value-objects/InventoryEnums';
import {
  InsufficientStockError,
  StockReservationConflictError,
} from '../errors/InventoryErrors';
import {
  createStockReservedEvent,
  createStockConsumedEvent,
  StockReservedV1,
  StockConsumedV1,
} from '../events/InventoryEvents.v1';

export interface StockItemProps {
  readonly companyId: UniqueEntityId;
  readonly name: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly movements: StockMovement[];
  readonly reservations: StockReservation[];
}

/**
 * StockItem — Inventory Aggregate Root.
 *
 * Rules (aggregates-design.md):
 *   - StockMovement is append-only
 *   - Reservation prevents consumption conflicts
 *   - Never mutated based on direct calls — only updated via events
 *
 * Rules (bounded-contexts.md):
 *   - Never called directly by Maintenance context
 *   - Updated via Event Bus
 *
 * Emits: StockReserved.v1, StockConsumed.v1
 */
export class StockItem extends AggregateRoot<StockItemProps> {
  private _quantity: number;

  private constructor(props: StockItemProps, id?: UniqueEntityId) {
    super(props, id);
    this._quantity = props.quantity;
  }

  // ─── Getters ────────────────────────────────────────────────────────────────

  get companyId(): UniqueEntityId { return this._props.companyId; }
  get name(): string { return this._props.name; }
  get quantity(): number { return this._quantity; }
  get unitPrice(): number { return this._props.unitPrice; }
  get movements(): ReadonlyArray<StockMovement> { return this._props.movements; }
  get reservations(): ReadonlyArray<StockReservation> { return this._props.reservations; }

  // ─── Computed ────────────────────────────────────────────────────────────────

  get reservedQuantity(): number {
    return this._props.reservations
      .filter((r) => r.isActive())
      .reduce((sum, r) => sum + r.quantity, 0);
  }

  get availableQuantity(): number {
    return this._quantity - this.reservedQuantity;
  }

  // ─── Domain Methods ──────────────────────────────────────────────────────────

  /**
   * Reserves stock for a WorkItem.
   * Invariant: no double reservation for the same workItemId.
   * Invariant: available quantity must cover the requested amount.
   * Emits: StockReserved.v1
   */
  reserve(params: {
    workItemId: string;
    quantity: number;
    correlationId: string;
  }): StockReservation {
    const conflict = this._props.reservations.find(
      (r) => r.workItemId.value === params.workItemId && r.isActive(),
    );
    if (conflict) {
      throw new StockReservationConflictError(this._id.value, params.workItemId);
    }

    if (params.quantity > this.availableQuantity) {
      throw new InsufficientStockError(this._id.value, params.quantity, this.availableQuantity);
    }

    const reservation = StockReservation.create({
      stockItemId: this._id.value,
      workItemId: params.workItemId,
      quantity: params.quantity,
    });
    this._props.reservations.push(reservation);

    const event: StockReservedV1 = createStockReservedEvent(
      {
        stockItemId: this._id.value,
        quantity: params.quantity,
        workItemId: params.workItemId,
      },
      {
        companyId: this._props.companyId.value,
        correlationId: params.correlationId,
      },
    );
    this.addDomainEvent(event);

    return reservation;
  }

  /**
   * Registers stock arriving (purchase receipt, return, etc.).
   * Appends a StockMovement of type IN.
   */
  receive(quantity: number, referenceId?: string): StockMovement {
    const movement = StockMovement.create({
      stockItemId: this._id.value,
      type: MovementType.IN,
      quantity,
      referenceId,
    });
    this._props.movements.push(movement);
    this._quantity += quantity;
    return movement;
  }

  /**
   * Consumes reserved stock (WorkItem completion).
   * Invariant: sufficient quantity must be available.
   * Emits: StockConsumed.v1
   */
  consume(params: {
    workItemId: string;
    quantity: number;
    correlationId: string;
  }): StockMovement {
    if (params.quantity > this._quantity) {
      throw new InsufficientStockError(this._id.value, params.quantity, this._quantity);
    }

    // Mark matching reservation as consumed
    const reservation = this._props.reservations.find(
      (r) => r.workItemId.value === params.workItemId && r.isActive(),
    );
    if (reservation) reservation.consume();

    const movement = StockMovement.create({
      stockItemId: this._id.value,
      type: MovementType.OUT,
      quantity: params.quantity,
      referenceId: params.workItemId,
    });
    this._props.movements.push(movement);
    this._quantity -= params.quantity;

    const event: StockConsumedV1 = createStockConsumedEvent(
      { stockItemId: this._id.value, quantity: params.quantity },
      { companyId: this._props.companyId.value, correlationId: params.correlationId },
    );
    this.addDomainEvent(event);

    return movement;
  }

  /**
   * Adjusts stock quantity (inventory reconciliation).
   * Appends a ADJUST movement for the delta.
   */
  adjust(newQuantity: number): StockMovement {
    const delta = newQuantity - this._quantity;
    const movement = StockMovement.create({
      stockItemId: this._id.value,
      type: MovementType.ADJUST,
      quantity: Math.abs(delta),
    });
    this._props.movements.push(movement);
    this._quantity = newQuantity;
    return movement;
  }

  // ─── Factory ─────────────────────────────────────────────────────────────────

  static create(
    props: {
      companyId: string;
      name: string;
      initialQuantity?: number;
      unitPrice: number;
    },
    id?: UniqueEntityId,
  ): StockItem {
    return new StockItem(
      {
        companyId: new UniqueEntityId(props.companyId),
        name: props.name,
        quantity: props.initialQuantity ?? 0,
        unitPrice: props.unitPrice,
        movements: [],
        reservations: [],
      },
      id,
    );
  }

  static reconstitute(props: StockItemProps, id: UniqueEntityId): StockItem {
    return new StockItem(props, id);
  }
}
