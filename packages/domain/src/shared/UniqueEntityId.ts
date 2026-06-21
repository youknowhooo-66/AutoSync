/**
 * UniqueEntityId — value object wrapping a string UUID.
 * Enforces that every entity identity is explicit and typed.
 */
export class UniqueEntityId {
  private readonly _value: string;

  constructor(value?: string) {
    this._value = value ?? UniqueEntityId.generate();
  }

  get value(): string {
    return this._value;
  }

  equals(other: UniqueEntityId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  /**
   * Generates a UUID v4-compatible string without external dependencies.
   * Pattern: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
   */
  private static generate(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
