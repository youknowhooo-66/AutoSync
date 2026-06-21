import { Entity } from '../../shared/Entity';
import { UniqueEntityId } from '../../shared/UniqueEntityId';
import { AccountStatus } from '../value-objects/FinanceEnums';
import { AccountAlreadyPaidError, AccountAlreadyCancelledError } from '../errors/FinanceErrors';

export interface AccountPayableProps {
  readonly supplierId: UniqueEntityId;
  readonly value: number;
  readonly dueDate: Date;
  readonly status: AccountStatus;
}

/**
 * AccountPayable — represents money owed to a supplier/vendor.
 * Created from inventory purchase events.
 */
export class AccountPayable extends Entity<AccountPayableProps> {
  private _status: AccountStatus;

  private constructor(props: AccountPayableProps, id?: UniqueEntityId) {
    super(props, id);
    this._status = props.status;
  }

  get supplierId(): UniqueEntityId { return this._props.supplierId; }
  get value(): number { return this._props.value; }
  get dueDate(): Date { return this._props.dueDate; }
  get status(): AccountStatus { return this._status; }

  pay(): void {
    if (this._status === AccountStatus.PAID) {
      throw new AccountAlreadyPaidError(this._id.value);
    }
    if (this._status === AccountStatus.CANCELLED) {
      throw new AccountAlreadyCancelledError(this._id.value);
    }
    this._status = AccountStatus.PAID;
  }

  cancel(): void {
    if (this._status === AccountStatus.PAID) {
      throw new AccountAlreadyPaidError(this._id.value);
    }
    this._status = AccountStatus.CANCELLED;
  }

  static create(
    props: { supplierId: string; value: number; dueDate: Date },
    id?: UniqueEntityId,
  ): AccountPayable {
    return new AccountPayable(
      {
        supplierId: new UniqueEntityId(props.supplierId),
        value: props.value,
        dueDate: props.dueDate,
        status: AccountStatus.PENDING,
      },
      id,
    );
  }

  static reconstitute(props: AccountPayableProps, id: UniqueEntityId): AccountPayable {
    return new AccountPayable(props, id);
  }
}
