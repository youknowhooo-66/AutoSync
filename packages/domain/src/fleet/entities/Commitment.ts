import { Entity } from '../../shared/Entity';
import { UniqueEntityId } from '../../shared/UniqueEntityId';
import { CommitmentExceedsContractValueError } from '../errors/FleetErrors';

export interface CommitmentProps {
  readonly contractId: UniqueEntityId;
  readonly value: number;
  readonly usedValue: number;
  readonly number: string;
  readonly date: Date;
}

/**
 * Commitment (Empenho) entity — public-sector budget reservation against a Contract.
 * Rule (ERD_DIAGRAM.md): tracks used vs total commitment value.
 */
export class Commitment extends Entity<CommitmentProps> {
  private constructor(props: CommitmentProps, id?: UniqueEntityId) {
    super(props, id);
  }

  get contractId(): UniqueEntityId { return this._props.contractId; }
  get value(): number { return this._props.value; }
  get usedValue(): number { return this._props.usedValue; }
  get number(): string { return this._props.number; }
  get date(): Date { return this._props.date; }
  get availableValue(): number { return this._props.value - this._props.usedValue; }

  /**
   * Records usage against this commitment (e.g., when Measurement is approved).
   * Invariant: cannot exceed total committed value.
   */
  use(amount: number): void {
    if (amount > this.availableValue) {
      throw new CommitmentExceedsContractValueError(this._props.contractId.value);
    }
    this._props = { ...this._props, usedValue: this._props.usedValue + amount };
  }

  static create(
    props: { contractId: string; value: number; number: string; date: Date },
    id?: UniqueEntityId,
  ): Commitment {
    return new Commitment(
      {
        contractId: new UniqueEntityId(props.contractId),
        value: props.value,
        usedValue: 0,
        number: props.number,
        date: props.date,
      },
      id,
    );
  }

  static reconstitute(props: CommitmentProps, id: UniqueEntityId): Commitment {
    return new Commitment(props, id);
  }
}
