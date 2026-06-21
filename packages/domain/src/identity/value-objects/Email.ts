import { ValueObject } from '../../shared/ValueObject';
import { InvalidEmailError } from '../errors/IdentityErrors';

interface EmailProps {
  readonly value: string;
}

/**
 * Email Value Object — validates basic email format.
 * Stored in lowercase.
 */
export class Email extends ValueObject<EmailProps> {
  private static readonly REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(props: EmailProps) {
    super(props);
  }

  get value(): string {
    return this._props.value;
  }

  static create(raw: string): Email {
    const normalized = raw.trim().toLowerCase();
    if (!Email.REGEX.test(normalized)) {
      throw new InvalidEmailError(raw);
    }
    return new Email({ value: normalized });
  }
}
