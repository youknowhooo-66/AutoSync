/**
 * Base Value Object class.
 * Equality is determined by structural value comparison, not identity.
 * All value objects are immutable.
 */
export abstract class ValueObject<TProps> {
  protected readonly _props: TProps;

  protected constructor(props: TProps) {
    this._props = Object.freeze(props) as TProps;
  }

  equals(other?: ValueObject<TProps>): boolean {
    if (other === null || other === undefined) return false;
    if (other._props === undefined) return false;
    return JSON.stringify(this._props) === JSON.stringify(other._props);
  }
}
