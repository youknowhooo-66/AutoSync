import { Entity } from '../../shared/Entity';
import { UniqueEntityId } from '../../shared/UniqueEntityId';
import { WorkItemStatus, WorkItemType } from '../value-objects/MaintenanceEnums';
import { WorkItemCannotTransitionError, WorkItemMustBelongToMaintenanceError } from '../errors/MaintenanceErrors';

// ─── Allowed state transitions ────────────────────────────────────────────────
const ALLOWED_TRANSITIONS: Record<WorkItemStatus, WorkItemStatus[]> = {
  [WorkItemStatus.PENDING]: [WorkItemStatus.AWAITING_APPROVAL, WorkItemStatus.CANCELLED],
  [WorkItemStatus.AWAITING_APPROVAL]: [WorkItemStatus.APPROVED, WorkItemStatus.REJECTED],
  [WorkItemStatus.APPROVED]: [WorkItemStatus.IN_EXECUTION, WorkItemStatus.CANCELLED],
  [WorkItemStatus.REJECTED]: [], // terminal
  [WorkItemStatus.IN_EXECUTION]: [WorkItemStatus.COMPLETED, WorkItemStatus.CANCELLED],
  [WorkItemStatus.COMPLETED]: [], // terminal
  [WorkItemStatus.CANCELLED]: [], // terminal
};

export interface WorkItemProps {
  readonly maintenanceId: UniqueEntityId;
  readonly type: WorkItemType;
  readonly description: string;
  readonly status: WorkItemStatus;
  readonly estimatedValue: number;
  readonly actualValue: number | null;
}

/**
 * WorkItem — the economic unit of the AutoSync system.
 *
 * Rules (aggregates-design.md):
 *   - Cannot exist without a Maintenance
 *   - Represents the economic unit (triggers financial events)
 *   - State depends on Approval + Execution
 *   - Status transitions are strictly enforced
 *
 * NOTE: WorkItem is managed INSIDE the Maintenance Aggregate Root.
 * It is a rich entity with its own state machine, but its lifecycle
 * is always controlled through Maintenance methods.
 */
export class WorkItem extends Entity<WorkItemProps> {
  private _status: WorkItemStatus;
  private _actualValue: number | null;

  private constructor(props: WorkItemProps, id?: UniqueEntityId) {
    super(props, id);
    this._status = props.status;
    this._actualValue = props.actualValue;
  }

  // ─── Getters ────────────────────────────────────────────────────────────────

  get maintenanceId(): UniqueEntityId { return this._props.maintenanceId; }
  get type(): WorkItemType { return this._props.type; }
  get description(): string { return this._props.description; }
  get status(): WorkItemStatus { return this._status; }
  get estimatedValue(): number { return this._props.estimatedValue; }
  get actualValue(): number | null { return this._actualValue; }

  // ─── State queries ───────────────────────────────────────────────────────────

  isResolved(): boolean {
    return (
      this._status === WorkItemStatus.APPROVED ||
      this._status === WorkItemStatus.REJECTED ||
      this._status === WorkItemStatus.COMPLETED ||
      this._status === WorkItemStatus.CANCELLED
    );
  }

  isPending(): boolean {
    return this._status === WorkItemStatus.PENDING;
  }

  isApproved(): boolean {
    return this._status === WorkItemStatus.APPROVED;
  }

  isCompleted(): boolean {
    return this._status === WorkItemStatus.COMPLETED;
  }

  // ─── Transitions (called by Maintenance Aggregate Root only) ─────────────────

  /** Called by Maintenance when it submits items for client approval. */
  submitForApproval(): void {
    this._transition(WorkItemStatus.AWAITING_APPROVAL);
  }

  /** Called by Maintenance when approval decision is APPROVED. */
  markApproved(): void {
    this._transition(WorkItemStatus.APPROVED);
  }

  /** Called by Maintenance when approval decision is REJECTED. */
  markRejected(): void {
    this._transition(WorkItemStatus.REJECTED);
  }

  /** Called by Maintenance when a technician starts executing this item. */
  startExecution(): void {
    this._transition(WorkItemStatus.IN_EXECUTION);
  }

  /** Called by Maintenance when execution is done and verified. */
  complete(actualValue: number): void {
    this._transition(WorkItemStatus.COMPLETED);
    this._actualValue = actualValue;
  }

  cancel(): void {
    this._transition(WorkItemStatus.CANCELLED);
  }

  // ─── Private transition guard ────────────────────────────────────────────────

  private _transition(to: WorkItemStatus): void {
    const allowed = ALLOWED_TRANSITIONS[this._status];
    if (!allowed.includes(to)) {
      throw new WorkItemCannotTransitionError(this._id.value, this._status, to);
    }
    this._status = to;
  }

  // ─── Factory ────────────────────────────────────────────────────────────────

  static create(
    props: {
      maintenanceId: string;
      type: WorkItemType;
      description: string;
      estimatedValue: number;
    },
    id?: UniqueEntityId,
  ): WorkItem {
    if (!props.maintenanceId) throw new WorkItemMustBelongToMaintenanceError();

    return new WorkItem(
      {
        maintenanceId: new UniqueEntityId(props.maintenanceId),
        type: props.type,
        description: props.description,
        status: WorkItemStatus.PENDING,
        estimatedValue: props.estimatedValue,
        actualValue: null,
      },
      id,
    );
  }

  static reconstitute(props: WorkItemProps, id: UniqueEntityId): WorkItem {
    return new WorkItem(props, id);
  }
}
