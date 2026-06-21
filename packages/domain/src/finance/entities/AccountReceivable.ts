import { Entity } from '../../shared/Entity';
import { UniqueEntityId } from '../../shared/UniqueEntityId';
import { AccountStatus } from '../value-objects/FinanceEnums';
import { AccountAlreadyPaidError, AccountAlreadyCancelledError } from '../errors/FinanceErrors';

export interface AccountReceivableProps {
  readonly clientId: UniqueEntityId;
  readonly value: number;
  readonly dueDate: Date;
  readonly status: AccountStatus;
}

/**
 * AccountReceivable — represents money owed by a client.
 * Created from maintenance completion events or invoice generation.
 */
export class AccountReceivable extends Entity<AccountReceivableProps> {
  private _status: AccountStatus;

  private constructor(props: AccountReceivableProps, id?: UniqueEntityId) {
    super(props, id);
    this._status = props.status;
  }

  get clientId(): UniqueEntityId { return this._props.clientId; }
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
    props: { clientId: string; value: number; dueDate: Date },
    id?: UniqueEntityId,
  ): AccountReceivable {
    return new AccountReceivable(
      {
        clientId: new UniqueEntityId(props.clientId),
        value: props.value,
        dueDate: props.dueDate,
        status: AccountStatus.PENDING,
      },
      id,
    );
  }

  static reconstitute(props: AccountReceivableProps, id: UniqueEntityId): AccountReceivable {
    return new AccountReceivable(props, id);
  }
}
