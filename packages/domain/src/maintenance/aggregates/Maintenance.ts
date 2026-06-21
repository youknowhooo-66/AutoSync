import { AggregateRoot } from '../../shared/AggregateRoot';
import { UniqueEntityId } from '../../shared/UniqueEntityId';
import { MaintenanceStatus, WorkItemStatus, WorkItemType, ApprovalStatus } from '../value-objects/MaintenanceEnums';
import { WorkItem } from '../entities/WorkItem';
import { Diagnosis } from '../entities/Diagnosis';
import { Approval } from '../entities/Approval';
import { MaintenanceRequest } from '../entities/MaintenanceRequest';
import {
  MaintenanceCannotFinalizeError,
  WorkItemNotFoundInMaintenanceError,
  MaintenanceAlreadyClosedError,
  ApprovalAlreadyExistsForWorkItemError,
} from '../errors/MaintenanceErrors';
import {
  createMaintenanceCreatedEvent,
  MaintenanceCreatedV1,
} from '../events/MaintenanceCreated.v1';
import {
  createWorkItemCreatedEvent,
  createWorkItemApprovedEvent,
  createWorkItemRejectedEvent,
  createWorkItemCompletedEvent,
  WorkItemCreatedV1,
  WorkItemApprovedV1,
  WorkItemRejectedV1,
  WorkItemCompletedV1,
} from '../events/WorkItemEvents.v1';

export interface MaintenanceProps {
  readonly companyId: UniqueEntityId;
  readonly requestId: UniqueEntityId | null;
  readonly contractId: UniqueEntityId | null;
  readonly clientId: UniqueEntityId;
  readonly vehicleId: UniqueEntityId;
  readonly status: MaintenanceStatus;
  readonly checkinAt: Date | null;
  readonly checkoutAt: Date | null;
  readonly workItems: WorkItem[];
  readonly diagnoses: Diagnosis[];
  readonly approvals: Approval[];
}

/**
 * Maintenance — Core Aggregate Root of the entire AutoSync system.
 *
 * Rules (aggregates-design.md):
 *   1. WorkItem cannot exist without Maintenance — enforced by requiring maintenanceId
 *   2. Approval is per WorkItem (NEVER global) — one Approval per WorkItem id
 *   3. Maintenance can only be finalized if ALL WorkItems are approved or rejected
 *   4. Maintenance is the central aggregator and controls the complete service lifecycle
 *
 * All business rules live here. No rule leaks to external services.
 *
 * Events emitted (event-contracts.md):
 *   - MaintenanceCreated.v1
 *   - WorkItemCreated.v1
 *   - WorkItemApproved.v1
 *   - WorkItemRejected.v1
 *   - WorkItemCompleted.v1
 */
export class Maintenance extends AggregateRoot<MaintenanceProps> {
  private _status: MaintenanceStatus;
  private _checkinAt: Date | null;
  private _checkoutAt: Date | null;

  private constructor(props: MaintenanceProps, id?: UniqueEntityId) {
    super(props, id);
    this._status = props.status;
    this._checkinAt = props.checkinAt;
    this._checkoutAt = props.checkoutAt;
  }

  // ─── Getters ────────────────────────────────────────────────────────────────

  get companyId(): UniqueEntityId { return this._props.companyId; }
  get requestId(): UniqueEntityId | null { return this._props.requestId; }
  get contractId(): UniqueEntityId | null { return this._props.contractId; }
  get clientId(): UniqueEntityId { return this._props.clientId; }
  get vehicleId(): UniqueEntityId { return this._props.vehicleId; }
  get status(): MaintenanceStatus { return this._status; }
  get checkinAt(): Date | null { return this._checkinAt; }
  get checkoutAt(): Date | null { return this._checkoutAt; }
  get workItems(): ReadonlyArray<WorkItem> { return this._props.workItems; }
  get diagnoses(): ReadonlyArray<Diagnosis> { return this._props.diagnoses; }
  get approvals(): ReadonlyArray<Approval> { return this._props.approvals; }

  // ─── Private Guards ──────────────────────────────────────────────────────────

  private _assertNotClosed(): void {
    if (
      this._status === MaintenanceStatus.COMPLETED ||
      this._status === MaintenanceStatus.CANCELLED
    ) {
      throw new MaintenanceAlreadyClosedError(this._id.value);
    }
  }

  private _findWorkItem(workItemId: string): WorkItem {
    const item = this._props.workItems.find((w) => w.id.value === workItemId);
    if (!item) throw new WorkItemNotFoundInMaintenanceError(workItemId);
    return item;
  }

  private _findApprovalForWorkItem(workItemId: string): Approval | undefined {
    return this._props.approvals.find((a) => a.workItemId.value === workItemId);
  }

  // ─── Check-in / Check-out ────────────────────────────────────────────────────

  checkin(): void {
    this._assertNotClosed();
    this._checkinAt = new Date();
    this._status = MaintenanceStatus.IN_DIAGNOSIS;
  }

  checkout(): void {
    this._assertNotClosed();
    this._checkoutAt = new Date();
  }

  // ─── Diagnosis ───────────────────────────────────────────────────────────────

  /**
   * Adds a new Diagnosis version. The previous diagnosis is kept in the list
   * for auditing; the latest entry is the current one.
   */
  addDiagnosis(
    props: { description: string; cause: string; estimatedHours: number },
    diagnosisId?: UniqueEntityId,
  ): Diagnosis {
    this._assertNotClosed();
    const diagnosis = Diagnosis.create(
      {
        maintenanceId: this._id.value,
        description: props.description,
        cause: props.cause,
        estimatedHours: props.estimatedHours,
      },
      diagnosisId,
    );
    this._props.diagnoses.push(diagnosis);
    return diagnosis;
  }

  get currentDiagnosis(): Diagnosis | null {
    if (this._props.diagnoses.length === 0) return null;
    return this._props.diagnoses[this._props.diagnoses.length - 1];
  }

  // ─── WorkItem Management ─────────────────────────────────────────────────────

  /**
   * Adds a new WorkItem to this Maintenance.
   * Invariant: WorkItem cannot exist without a parent Maintenance.
   * Emits: WorkItemCreated.v1
   */
  addWorkItem(
    props: {
      type: WorkItemType;
      description: string;
      estimatedValue: number;
      correlationId: string;
    },
    workItemId?: UniqueEntityId,
  ): WorkItem {
    this._assertNotClosed();

    const workItem = WorkItem.create(
      {
        maintenanceId: this._id.value,
        type: props.type,
        description: props.description,
        estimatedValue: props.estimatedValue,
      },
      workItemId,
    );
    this._props.workItems.push(workItem);

    const event: WorkItemCreatedV1 = createWorkItemCreatedEvent(
      {
        workItemId: workItem.id.value,
        maintenanceId: this._id.value,
        description: props.description,
        estimatedCost: props.estimatedValue,
      },
      {
        companyId: this._props.companyId.value,
        correlationId: props.correlationId,
      },
    );
    this.addDomainEvent(event);

    return workItem;
  }

  // ─── Approval Management ─────────────────────────────────────────────────────

  /**
   * Submits all PENDING WorkItems for client approval.
   * This transitions their status to AWAITING_APPROVAL.
   */
  submitForApproval(): void {
    this._assertNotClosed();
    this._status = MaintenanceStatus.AWAITING_APPROVAL;
    for (const item of this._props.workItems) {
      if (item.isPending()) {
        item.submitForApproval();
        // Create pending Approval record for each submitted WorkItem
        const approval = Approval.createPending({
          maintenanceId: this._id.value,
          workItemId: item.id.value,
        });
        this._props.approvals.push(approval);
      }
    }
  }

  /**
   * Records an APPROVE decision for a specific WorkItem.
   * Invariant: Approval is per WorkItem (aggregates-design.md).
   * Invariant: Cannot re-decide an already-decided Approval.
   * Emits: WorkItemApproved.v1
   */
  approveWorkItem(params: {
    workItemId: string;
    approvedBy: string;
    correlationId: string;
  }): void {
    this._assertNotClosed();
    const workItem = this._findWorkItem(params.workItemId);
    let approval = this._findApprovalForWorkItem(params.workItemId);

    if (!approval) {
      approval = Approval.createPending({
        maintenanceId: this._id.value,
        workItemId: params.workItemId,
      });
      this._props.approvals.push(approval);
    }

    if (approval.isDecided()) {
      throw new ApprovalAlreadyExistsForWorkItemError(params.workItemId);
    }

    approval.approve(params.approvedBy);
    workItem.markApproved();

    const event: WorkItemApprovedV1 = createWorkItemApprovedEvent(
      {
        workItemId: params.workItemId,
        maintenanceId: this._id.value,
        approvedBy: params.approvedBy,
      },
      {
        companyId: this._props.companyId.value,
        correlationId: params.correlationId,
      },
    );
    this.addDomainEvent(event);

    this._checkAndAdvanceToExecution();
  }

  /**
   * Records a REJECT decision for a specific WorkItem.
   * Invariant: Approval is per WorkItem (aggregates-design.md).
   * Emits: WorkItemRejected.v1
   */
  rejectWorkItem(params: {
    workItemId: string;
    reason: string;
    correlationId: string;
  }): void {
    this._assertNotClosed();
    const workItem = this._findWorkItem(params.workItemId);
    let approval = this._findApprovalForWorkItem(params.workItemId);

    if (!approval) {
      approval = Approval.createPending({
        maintenanceId: this._id.value,
        workItemId: params.workItemId,
      });
      this._props.approvals.push(approval);
    }

    if (approval.isDecided()) {
      throw new ApprovalAlreadyExistsForWorkItemError(params.workItemId);
    }

    approval.reject(params.reason);
    workItem.markRejected();

    const event: WorkItemRejectedV1 = createWorkItemRejectedEvent(
      {
        workItemId: params.workItemId,
        reason: params.reason,
      },
      {
        companyId: this._props.companyId.value,
        correlationId: params.correlationId,
      },
    );
    this.addDomainEvent(event);
  }

  // ─── Execution ───────────────────────────────────────────────────────────────

  startWorkItemExecution(workItemId: string): void {
    this._assertNotClosed();
    const workItem = this._findWorkItem(workItemId);
    workItem.startExecution();
    if (this._status !== MaintenanceStatus.IN_EXECUTION) {
      this._status = MaintenanceStatus.IN_EXECUTION;
    }
  }

  /**
   * Marks a WorkItem as COMPLETED with its final actual cost.
   * Emits: WorkItemCompleted.v1
   */
  completeWorkItem(params: {
    workItemId: string;
    actualValue: number;
    correlationId: string;
  }): void {
    this._assertNotClosed();
    const workItem = this._findWorkItem(params.workItemId);
    workItem.complete(params.actualValue);

    const event: WorkItemCompletedV1 = createWorkItemCompletedEvent(
      {
        workItemId: params.workItemId,
        totalCost: params.actualValue,
      },
      {
        companyId: this._props.companyId.value,
        correlationId: params.correlationId,
      },
    );
    this.addDomainEvent(event);
  }

  // ─── Finalization ────────────────────────────────────────────────────────────

  /**
   * Finalizes the Maintenance.
   *
   * INVARIANT (aggregates-design.md):
   *   Maintenance can only be finalized if ALL WorkItems are in a resolved state:
   *   APPROVED, REJECTED, COMPLETED, or CANCELLED.
   *
   *   Items still in PENDING, AWAITING_APPROVAL, or IN_EXECUTION block finalization.
   */
  finalize(): void {
    this._assertNotClosed();

    const unresolvedItems = this._props.workItems.filter(
      (item) =>
        item.status === WorkItemStatus.PENDING ||
        item.status === WorkItemStatus.AWAITING_APPROVAL ||
        item.status === WorkItemStatus.IN_EXECUTION,
    );

    if (unresolvedItems.length > 0) {
      throw new MaintenanceCannotFinalizeError(unresolvedItems.length);
    }

    this._status = MaintenanceStatus.COMPLETED;
    this._checkoutAt = new Date();
  }

  cancel(): void {
    this._assertNotClosed();
    this._status = MaintenanceStatus.CANCELLED;
    // Cancel all non-terminal WorkItems
    for (const item of this._props.workItems) {
      if (!item.isResolved()) {
        item.cancel();
      }
    }
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────────

  /**
   * After an approval, checks if all awaiting items are now decided
   * and advances the maintenance status to IN_EXECUTION if applicable.
   */
  private _checkAndAdvanceToExecution(): void {
    const allDecided = this._props.workItems
      .filter((w) => w.status === WorkItemStatus.AWAITING_APPROVAL)
      .length === 0;

    if (allDecided && this._status === MaintenanceStatus.AWAITING_APPROVAL) {
      const anyApproved = this._props.workItems.some((w) => w.isApproved());
      if (anyApproved) {
        this._status = MaintenanceStatus.IN_EXECUTION;
      }
    }
  }

  // ─── Query helpers ───────────────────────────────────────────────────────────

  totalEstimatedValue(): number {
    return this._props.workItems.reduce((sum, w) => sum + w.estimatedValue, 0);
  }

  totalActualValue(): number {
    return this._props.workItems.reduce((sum, w) => sum + (w.actualValue ?? 0), 0);
  }

  // ─── Factory ─────────────────────────────────────────────────────────────────

  /**
   * Opens a new Maintenance.
   * Emits: MaintenanceCreated.v1
   */
  static open(
    props: {
      companyId: string;
      clientId: string;
      vehicleId: string;
      requestId?: string;
      contractId?: string;
      correlationId: string;
    },
    id?: UniqueEntityId,
  ): Maintenance {
    const maintenance = new Maintenance(
      {
        companyId: new UniqueEntityId(props.companyId),
        requestId: props.requestId ? new UniqueEntityId(props.requestId) : null,
        contractId: props.contractId ? new UniqueEntityId(props.contractId) : null,
        clientId: new UniqueEntityId(props.clientId),
        vehicleId: new UniqueEntityId(props.vehicleId),
        status: MaintenanceStatus.OPEN,
        checkinAt: null,
        checkoutAt: null,
        workItems: [],
        diagnoses: [],
        approvals: [],
      },
      id,
    );

    const event: MaintenanceCreatedV1 = createMaintenanceCreatedEvent(
      {
        maintenanceId: maintenance.id.value,
        clientId: props.clientId,
        vehicleId: props.vehicleId,
      },
      {
        companyId: props.companyId,
        correlationId: props.correlationId,
      },
    );
    maintenance.addDomainEvent(event);

    return maintenance;
  }

  static reconstitute(props: MaintenanceProps, id: UniqueEntityId): Maintenance {
    return new Maintenance(props, id);
  }
}
