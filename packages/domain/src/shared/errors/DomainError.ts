/**
 * DomainError — base class for all domain-layer errors.
 * Distinguishes domain violations from infrastructure errors.
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
