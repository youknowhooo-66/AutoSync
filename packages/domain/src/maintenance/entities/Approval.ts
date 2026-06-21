import { Entity } from '../../shared/Entity';
import { UniqueEntityId } from '../../shared/UniqueEntityId';
import { ApprovalStatus } from '../value-objects/MaintenanceEnums';
import { ApprovalAlreadyExistsForWorkItemError } from '../errors/MaintenanceErrors';

export interface ApprovalProps {
  readonly maintenanceId: UniqueEntityId;
  readonly workItemId: UniqueEntityId;
  readonly status: ApprovalStatus;
  readonly approvedBy: string | null;
  readonly approvedAt: Date | null;
  readonly rejectionReason: string | null;
}

/**
 * Approval entity — represents a formal approval/rejection decision on a WorkItem.
 *
 * Rules (aggregates-design.md):
 *   - Approval is per WorkItem (NEVER global)
 *   - Approval is an immutable historical record (domain-prisma-mapping.md)
 *
 * Invariant: once a decision (APPROVED or REJECTED) is made, the Approval
 * entity is closed — no further changes allowed.
 */
export class Approval extends Entity<ApprovalProps> {
  private _status: ApprovalStatus;
  private _approvedBy: string | null;
  private _approvedAt: Date | null;
  private _rejectionReason: string | null;

  private constructor(props: ApprovalProps, id?: UniqueEntityId) {
    super(props, id);
    this._status = props.status;
    this._approvedBy = props.approvedBy;
    this._approvedAt = props.approvedAt;
    this._rejectionReason = props.rejectionReason;
  }

  get maintenanceId(): UniqueEntityId { return this._props.maintenanceId; }
  get workItemId(): UniqueEntityId { return this._props.workItemId; }
  get status(): ApprovalStatus { return this._status; }
  get approvedBy(): string | null { return this._approvedBy; }
  get approvedAt(): Date | null { return this._approvedAt; }
  get rejectionReason(): string | null { return this._rejectionReason; }

  isDecided(): boolean {
    return this._status !== ApprovalStatus.PENDING;
  }

  /**
   * Records an APPROVE decision.
   * Invariant: cannot re-decide an already-decided Approval.
   */
  approve(approvedBy: string): void {
    if (this.isDecided()) {
      throw new ApprovalAlreadyExistsForWorkItemError(this._props.workItemId.value);
    }
    this._status = ApprovalStatus.APPROVED;
    this._approvedBy = approvedBy;
    this._approvedAt = new Date();
  }

  /**
   * Records a REJECT decision.
   * Invariant: cannot re-decide an already-decided Approval.
   */
  reject(reason: string): void {
    if (this.isDecided()) {
      throw new ApprovalAlreadyExistsForWorkItemError(this._props.workItemId.value);
    }
    this._status = ApprovalStatus.REJECTED;
    this._rejectionReason = reason;
    this._approvedAt = new Date();
  }

  static createPending(
    props: { maintenanceId: string; workItemId: string },
    id?: UniqueEntityId,
  ): Approval {
    return new Approval(
      {
        maintenanceId: new UniqueEntityId(props.maintenanceId),
        workItemId: new UniqueEntityId(props.workItemId),
        status: ApprovalStatus.PENDING,
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,
      },
      id,
    );
  }

  static reconstitute(props: ApprovalProps, id: UniqueEntityId): Approval {
    return new Approval(props, id);
  }
}
