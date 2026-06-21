import { Entity } from '../../shared/Entity';
import { UniqueEntityId } from '../../shared/UniqueEntityId';

export interface TechnicalAssignmentProps {
  readonly workItemId: UniqueEntityId;
  readonly userId: UniqueEntityId;
  readonly specialty: string;
  readonly createdAt: Date;
}

/**
 * TechnicalAssignment — links a technician (User) to a WorkItem.
 *
 * Rules (aggregates-design.md / bounded-contexts.md):
 *   - Does NOT alter Maintenance state directly (event-driven)
 *   - Only registers who is executing what
 *   - Execution context is event-driven from Maintenance context
 */
export class TechnicalAssignment extends Entity<TechnicalAssignmentProps> {
  private constructor(props: TechnicalAssignmentProps, id?: UniqueEntityId) {
    super(props, id);
  }

  get workItemId(): UniqueEntityId { return this._props.workItemId; }
  get userId(): UniqueEntityId { return this._props.userId; }
  get specialty(): string { return this._props.specialty; }
  get createdAt(): Date { return this._props.createdAt; }

  static create(
    props: { workItemId: string; userId: string; specialty: string },
    id?: UniqueEntityId,
  ): TechnicalAssignment {
    return new TechnicalAssignment(
      {
        workItemId: new UniqueEntityId(props.workItemId),
        userId: new UniqueEntityId(props.userId),
        specialty: props.specialty,
        createdAt: new Date(),
      },
      id,
    );
  }

  static reconstitute(props: TechnicalAssignmentProps, id: UniqueEntityId): TechnicalAssignment {
    return new TechnicalAssignment(props, id);
  }
}
