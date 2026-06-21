import { Entity } from '../../shared/Entity';
import { UniqueEntityId } from '../../shared/UniqueEntityId';
import { Email } from '../value-objects/Email';
import { UserMustBelongToCompanyError } from '../errors/IdentityErrors';

export interface UserProps {
  readonly companyId: UniqueEntityId;
  readonly branchId: UniqueEntityId;
  readonly name: string;
  readonly email: Email;
  /**
   * Password is stored as a hashed string.
   * The domain does not handle hashing — that is infrastructure concern.
   * The domain only enforces that a password is always present.
   */
  readonly passwordHash: string;
  readonly roleId: UniqueEntityId;
  readonly active: boolean;
}

/**
 * User entity — belongs to a Company and is scoped to a Branch.
 * Rule (aggregates-design.md):
 *   - User belongs to a Company
 *   - Role defines operational permissions
 *   - Branch is isolated inside Company
 */
export class User extends Entity<UserProps> {
  private constructor(props: UserProps, id?: UniqueEntityId) {
    super(props, id);
  }

  get companyId(): UniqueEntityId {
    return this._props.companyId;
  }

  get branchId(): UniqueEntityId {
    return this._props.branchId;
  }

  get name(): string {
    return this._props.name;
  }

  get email(): Email {
    return this._props.email;
  }

  get passwordHash(): string {
    return this._props.passwordHash;
  }

  get roleId(): UniqueEntityId {
    return this._props.roleId;
  }

  get active(): boolean {
    return this._props.active;
  }

  isActive(): boolean {
    return this._props.active;
  }

  belongsToCompany(companyId: UniqueEntityId): boolean {
    return this._props.companyId.equals(companyId);
  }

  belongsToBranch(branchId: UniqueEntityId): boolean {
    return this._props.branchId.equals(branchId);
  }

  static create(
    props: {
      companyId: string;
      branchId: string;
      name: string;
      email: string;
      passwordHash: string;
      roleId: string;
      active?: boolean;
    },
    id?: UniqueEntityId,
  ): User {
    if (!props.companyId) throw new UserMustBelongToCompanyError();

    return new User(
      {
        companyId: new UniqueEntityId(props.companyId),
        branchId: new UniqueEntityId(props.branchId),
        name: props.name,
        email: Email.create(props.email),
        passwordHash: props.passwordHash,
        roleId: new UniqueEntityId(props.roleId),
        active: props.active ?? true,
      },
      id,
    );
  }

  static reconstitute(props: UserProps, id: UniqueEntityId): User {
    return new User(props, id);
  }
}
