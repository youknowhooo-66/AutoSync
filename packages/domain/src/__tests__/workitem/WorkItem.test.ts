import { describe, it, expect } from 'vitest';
import { WorkItem } from '../../maintenance/entities/WorkItem';
import { WorkItemStatus, WorkItemType } from '../../maintenance/value-objects/MaintenanceEnums';
import { WorkItemCannotTransitionError } from '../../maintenance/errors/MaintenanceErrors';

describe('WorkItem State Transitions', () => {
  const maintenanceId = 'maint-123';

  it('should be created in PENDING state', () => {
    const workItem = WorkItem.create({
      maintenanceId,
      type: WorkItemType.PAINT,
      description: 'Paint door',
      estimatedValue: 500,
    });

    expect(workItem.status).toBe(WorkItemStatus.PENDING);
    expect(workItem.estimatedValue).toBe(500);
    expect(workItem.actualValue).toBeNull();
  });

  it('should follow the happy path transitions: PENDING -> AWAITING_APPROVAL -> APPROVED -> IN_EXECUTION -> COMPLETED', () => {
    const workItem = WorkItem.create({
      maintenanceId,
      type: WorkItemType.PAINT,
      description: 'Paint door',
      estimatedValue: 500,
    });

    workItem.submitForApproval();
    expect(workItem.status).toBe(WorkItemStatus.AWAITING_APPROVAL);

    workItem.markApproved();
    expect(workItem.status).toBe(WorkItemStatus.APPROVED);

    workItem.startExecution();
    expect(workItem.status).toBe(WorkItemStatus.IN_EXECUTION);

    workItem.complete(550);
    expect(workItem.status).toBe(WorkItemStatus.COMPLETED);
    expect(workItem.actualValue).toBe(550);
  });

  it('should prevent invalid state transitions (e.g., PENDING -> IN_EXECUTION)', () => {
    const workItem = WorkItem.create({
      maintenanceId,
      type: WorkItemType.PAINT,
      description: 'Paint door',
      estimatedValue: 500,
    });

    expect(() => workItem.startExecution()).toThrow(WorkItemCannotTransitionError);
  });

  it('should allow rejection from AWAITING_APPROVAL', () => {
    const workItem = WorkItem.create({
      maintenanceId,
      type: WorkItemType.PAINT,
      description: 'Paint door',
      estimatedValue: 500,
    });

    workItem.submitForApproval();
    workItem.markRejected();

    expect(workItem.status).toBe(WorkItemStatus.REJECTED);
    expect(workItem.isResolved()).toBe(true);
  });

  it('should block changes after REJECTED (Terminal State)', () => {
    const workItem = WorkItem.create({
      maintenanceId,
      type: WorkItemType.PAINT,
      description: 'Paint door',
      estimatedValue: 500,
    });

    workItem.submitForApproval();
    workItem.markRejected();

    // Rejection is a terminal state, cannot be approved after being rejected
    expect(() => workItem.markApproved()).toThrow(WorkItemCannotTransitionError);
  });
});
