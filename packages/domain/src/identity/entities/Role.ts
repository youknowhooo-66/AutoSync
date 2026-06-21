import { Entity } from '../../shared/Entity';
import { UniqueEntityId } from '../../shared/UniqueEntityId';
import { Permissions } from '../value-objects/Permissions';

export interface RoleProps {
  readonly name: string;
  readonly permissions: Permissions;
}

/**
 * Role entity — defines the set of operational permissions for a User.
 * Rule (aggregates-design.md): Role defines operational permissions.
 */
export class Role extends Entity<RoleProps> {
  private constructor(props: RoleProps, id?: UniqueEntityId) {
    super(props, id);
  }

  get name(): string {
    return this._props.name;
  }

  get permissions(): Permissions {
    return this._props.permissions;
  }

  hasPermission(permission: string): boolean {
    return this._props.permissions.has(permission);
  }

  static create(props: { name: string; permissions: string[] }, id?: UniqueEntityId): Role {
    const permissions = Permissions.create(props.permissions);
    return new Role({ name: props.name, permissions }, id);
  }

  static reconstitute(props: RoleProps, id: UniqueEntityId): Role {
    return new Role(props, id);
  }
}
