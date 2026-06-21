import { Entity } from '../../shared/Entity';
import { UniqueEntityId } from '../../shared/UniqueEntityId';
import { InvalidTimeEntryError } from '../errors/ExecutionErrors';

export interface TechnicalTimeEntryProps {
  readonly assignmentId: UniqueEntityId;
  readonly workItemId: UniqueEntityId;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly hours: number;
}

/**
 * TechnicalTimeEntry — immutable, append-only record of time spent on a WorkItem.
 *
 * Rules (aggregates-design.md): TimeEntry is immutable append-only.
 * Rules (domain-prisma-mapping.md): TimeEntry = append-only.
 *
 * No mutation methods. Once created, this entity is a permanent fact.
 * If a correction is needed, a new entry with a negative adjustment is appended.
 */
export class TechnicalTimeEntry extends Entity<TechnicalTimeEntryProps> {
  private constructor(props: TechnicalTimeEntryProps, id?: UniqueEntityId) {
    super(props, id);
  }

  get assignmentId(): UniqueEntityId { return this._props.assignmentId; }
  get workItemId(): UniqueEntityId { return this._props.workItemId; }
  get startTime(): Date { return this._props.startTime; }
  get endTime(): Date { return this._props.endTime; }
  get hours(): number { return this._props.hours; }

  static create(
    props: {
      assignmentId: string;
      workItemId: string;
      startTime: Date;
      endTime: Date;
    },
    id?: UniqueEntityId,
  ): TechnicalTimeEntry {
    if (props.endTime <= props.startTime) {
      throw new InvalidTimeEntryError('endTime must be after startTime.');
    }
    const diffMs = props.endTime.getTime() - props.startTime.getTime();
    const hours = diffMs / (1000 * 60 * 60);

    return new TechnicalTimeEntry(
      {
        assignmentId: new UniqueEntityId(props.assignmentId),
        workItemId: new UniqueEntityId(props.workItemId),
        startTime: props.startTime,
        endTime: props.endTime,
        hours,
      },
      id,
    );
  }

  static reconstitute(props: TechnicalTimeEntryProps, id: UniqueEntityId): TechnicalTimeEntry {
    return new TechnicalTimeEntry(props, id);
  }
}
