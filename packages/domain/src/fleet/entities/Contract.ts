import { Entity } from '../../shared/Entity';
import { UniqueEntityId } from '../../shared/UniqueEntityId';
import { ContractStatus } from '../value-objects/FleetEnums';
import { CommitmentExceedsContractValueError, ContractAlreadyExpiredError } from '../errors/FleetErrors';

export interface ContractProps {
  readonly clientId: UniqueEntityId;
  readonly companyId: UniqueEntityId;
  readonly number: string;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly totalValue: number;
  readonly remainingValue: number;
  readonly status: ContractStatus;
}

/**
 * Contract entity — represents a service agreement (public or private).
 * Tracks remaining budget for Measurement (medição) flows.
 */
export class Contract extends Entity<ContractProps> {
  private constructor(props: ContractProps, id?: UniqueEntityId) {
    super(props, id);
  }

  get clientId(): UniqueEntityId { return this._props.clientId; }
  get companyId(): UniqueEntityId { return this._props.companyId; }
  get number(): string { return this._props.number; }
  get startDate(): Date { return this._props.startDate; }
  get endDate(): Date { return this._props.endDate; }
  get totalValue(): number { return this._props.totalValue; }
  get remainingValue(): number { return this._props.remainingValue; }
  get status(): ContractStatus { return this._props.status; }

  isActive(): boolean {
    return this._props.status === ContractStatus.ACTIVE;
  }

  isExpired(): boolean {
    return new Date() > this._props.endDate || this._props.status === ContractStatus.EXPIRED;
  }

  /**
   * Debits an amount from remaining value (used when Measurement is approved).
   * Invariant: Contract must be active and have sufficient remaining value.
   */
  debit(amount: number): void {
    if (!this.isActive() || this.isExpired()) {
      throw new ContractAlreadyExpiredError(this._id.value);
    }
    if (amount > this._props.remainingValue) {
      throw new CommitmentExceedsContractValueError(this._id.value);
    }
    this._props = { ...this._props, remainingValue: this._props.remainingValue - amount };
  }

  static create(
    props: {
      clientId: string;
      companyId: string;
      number: string;
      startDate: Date;
      endDate: Date;
      totalValue: number;
    },
    id?: UniqueEntityId,
  ): Contract {
    return new Contract(
      {
        clientId: new UniqueEntityId(props.clientId),
        companyId: new UniqueEntityId(props.companyId),
        number: props.number,
        startDate: props.startDate,
        endDate: props.endDate,
        totalValue: props.totalValue,
        remainingValue: props.totalValue,
        status: ContractStatus.ACTIVE,
      },
      id,
    );
  }

  static reconstitute(props: ContractProps, id: UniqueEntityId): Contract {
    return new Contract(props, id);
  }
}
