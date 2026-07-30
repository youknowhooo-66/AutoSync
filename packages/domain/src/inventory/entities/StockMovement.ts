import { Entity } from '../../shared/Entity';
import { UniqueEntityId } from '../../shared/UniqueEntityId';
import { MovementType } from '../value-objects/InventoryEnums';

export interface StockMovementProps {
  readonly stockItemId: UniqueEntityId;
  readonly type: MovementType;
  readonly quantity: number;
  readonly referenceId: string | null; // WorkItem id or Purchase id
  readonly createdAt: Date;
}

/**
 * StockMovement — immutable, append-only ledger entry for inventory changes.
 *
 * Rules (aggregates-design.md): StockMovement is append-only.
 * Rules (domain-prisma-mapping.md): StockMovement nunca é atualizado.
 *
 * No mutation methods exist. Corrections are made via new compensating entries.
 */
export class StockMovement extends Entity<StockMovementProps> {
  private constructor(props: StockMovementProps, id?: UniqueEntityId) {
    super(props, id);
  }

  get stockItemId(): UniqueEntityId { return this._props.stockItemId; }
  get type(): MovementType { return this._props.type; }
  get quantity(): number { return this._props.quantity; }
  get referenceId(): string | null { return this._props.referenceId; }
  get createdAt(): Date { return this._props.createdAt; }

  static create(
    props: {
      stockItemId: string;
      type: MovementType;
      quantity: number;
      referenceId?: string;
    },
    id?: UniqueEntityId,
  ): StockMovement {
    return new StockMovement(
      {
        stockItemId: new UniqueEntityId(props.stockItemId),
        type: props.type,
        quantity: props.quantity,
        referenceId: props.referenceId ?? null,
        createdAt: new Date(),
      },
      id,
    );
  }

  static reconstitute(props: StockMovementProps, id: UniqueEntityId): StockMovement {
    return new StockMovement(props, id);
  }
}
