import { Entity } from '../../shared/Entity';
import { UniqueEntityId } from '../../shared/UniqueEntityId';

export interface DiagnosisProps {
  readonly maintenanceId: UniqueEntityId;
  readonly description: string;
  readonly cause: string;
  readonly estimatedHours: number;
  readonly createdAt: Date;
}

/**
 * Diagnosis entity — technical assessment performed during a Maintenance.
 * Rule (domain-prisma-mapping.md): Diagnosis can be versioned (new entities per version).
 * A Diagnosis is NOT mutable — a new Diagnosis replaces the old one.
 */
export class Diagnosis extends Entity<DiagnosisProps> {
  private constructor(props: DiagnosisProps, id?: UniqueEntityId) {
    super(props, id);
  }

  get maintenanceId(): UniqueEntityId { return this._props.maintenanceId; }
  get description(): string { return this._props.description; }
  get cause(): string { return this._props.cause; }
  get estimatedHours(): number { return this._props.estimatedHours; }
  get createdAt(): Date { return this._props.createdAt; }

  static create(
    props: { maintenanceId: string; description: string; cause: string; estimatedHours: number },
    id?: UniqueEntityId,
  ): Diagnosis {
    return new Diagnosis(
      {
        maintenanceId: new UniqueEntityId(props.maintenanceId),
        description: props.description,
        cause: props.cause,
        estimatedHours: props.estimatedHours,
        createdAt: new Date(),
      },
      id,
    );
  }

  static reconstitute(props: DiagnosisProps, id: UniqueEntityId): Diagnosis {
    return new Diagnosis(props, id);
  }
}
