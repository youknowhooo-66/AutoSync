import { ValueObject } from '../../shared/ValueObject';
import { RolePermissionsEmptyError } from '../errors/IdentityErrors';

interface PermissionsProps {
  readonly values: ReadonlyArray<string>;
}

/**
 * Permissions Value Object — wraps the list of permission strings for a Role.
 * At least one permission is required (invariant from aggregates-design.md).
 */
export class Permissions extends ValueObject<PermissionsProps> {
  private constructor(props: PermissionsProps) {
    super(props);
  }

  get values(): ReadonlyArray<string> {
    return this._props.values;
  }

  has(permission: string): boolean {
    return this._props.values.includes(permission);
  }

  static create(permissions: string[]): Permissions {
    if (!permissions || permissions.length === 0) {
      throw new RolePermissionsEmptyError();
    }
    return new Permissions({ values: Object.freeze([...permissions]) });
  }
}
