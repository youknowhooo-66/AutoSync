import { ValueObject } from '../../shared/ValueObject';
import { InvalidPlateError } from '../errors/FleetErrors';

interface PlateProps {
  readonly value: string;
}

/**
 * Plate Value Object — Brazilian vehicle plates.
 * Accepts:
 *   - Old format: ABC-1234 (3 letters + 4 digits)
 *   - Mercosul format: ABC1D23 (3 letters + 1 digit + 1 letter + 2 digits)
 * Stored normalized (uppercase, no hyphen).
 */
export class Plate extends ValueObject<PlateProps> {
  private static readonly OLD_FORMAT = /^[A-Z]{3}\d{4}$/;
  private static readonly MERCOSUL_FORMAT = /^[A-Z]{3}\d[A-Z]\d{2}$/;

  private constructor(props: PlateProps) {
    super(props);
  }

  get value(): string {
    return this._props.value;
  }

  static create(raw: string): Plate {
    const normalized = raw.trim().toUpperCase().replace(/[-\s]/g, '');
    if (!Plate.OLD_FORMAT.test(normalized) && !Plate.MERCOSUL_FORMAT.test(normalized)) {
      throw new InvalidPlateError(raw);
    }
    return new Plate({ value: normalized });
  }
}
