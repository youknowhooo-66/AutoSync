import { UniqueEntityId } from './UniqueEntityId';

/**
 * Base Entity class.
 * All domain entities extend this.
 * Equality is determined by identity, not by attribute values.
 */
export abstract class Entity<TProps> {
  protected readonly _id: UniqueEntityId;
  protected _props: TProps;

  protected constructor(props: TProps, id?: UniqueEntityId) {
    this._id = id ?? new UniqueEntityId();
    this._props = props;
  }

  get id(): UniqueEntityId {
    return this._id;
  }

  equals(other?: Entity<TProps>): boolean {
    if (other === null || other === undefined) return false;
    if (this === other) return true;
    if (!(other instanceof Entity)) return false;
    return this._id.equals(other._id);
  }
}
