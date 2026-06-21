import { ValueObject } from '../../shared/ValueObject';
import { InvalidDocumentError } from '../errors/IdentityErrors';

interface DocumentProps {
  readonly value: string;
}

/**
 * Document Value Object — wraps CNPJ (14 digits) or CPF (11 digits).
 * Stores only digits; validates length.
 */
export class Document extends ValueObject<DocumentProps> {
  private constructor(props: DocumentProps) {
    super(props);
  }

  get value(): string {
    return this._props.value;
  }

  static create(raw: string): Document {
    const digits = raw.replace(/\D/g, '');
    if (digits.length !== 11 && digits.length !== 14) {
      throw new InvalidDocumentError(raw);
    }
    return new Document({ value: digits });
  }
}
