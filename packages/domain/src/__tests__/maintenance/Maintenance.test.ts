import { describe, it, expect, beforeEach } from 'vitest';
import { Maintenance } from '../../maintenance/aggregates/Maintenance';
import { MaintenanceStatus, WorkItemStatus, WorkItemType } from '../../maintenance/value-objects/MaintenanceEnums';
import {
  MaintenanceCannotFinalizeError,
  WorkItemNotFoundInMaintenanceError,
  MaintenanceAlreadyClosedError,
} from '../../maintenance/errors/MaintenanceErrors';

describe('Maintenance Aggregate Invariants', () => {
  const companyId = 'company-123';
  const clientId = 'client-123';
  const vehicleId = 'vehicle-123';
  const correlationId = 'corr-123';

  let maintenance: Maintenance;

  beforeEach(() => {
    maintenance = Maintenance.open({
      companyId,
      clientId,
      vehicleId,
      correlationId,
    });
  });

  describe('Lifecycle and Finalization', () => {
    it('should open a new maintenance in OPEN status and emit MaintenanceCreated', () => {
      expect(maintenance.status).toBe(MaintenanceStatus.OPEN);
      expect(maintenance.domainEvents.length).toBe(1);
      expect(maintenance.domainEvents[0].eventType).toBe('MaintenanceCreated');
    });

    it('should allow checkin and transition to IN_DIAGNOSIS', () => {
      maintenance.checkin();
      expect(maintenance.status).toBe(MaintenanceStatus.IN_DIAGNOSIS);
      expect(maintenance.checkinAt).toBeInstanceOf(Date);
    });

    it('should NOT allow finalization if there are unresolved WorkItems', () => {
      // Add a WorkItem
      maintenance.addWorkItem({
        type: WorkItemType.MECHANIC,
        description: 'Oil change',
        estimatedValue: 150,
        correlationId,
      });

      // WorkItem is PENDING, finalization should fail
      expect(() => maintenance.finalize()).toThrow(MaintenanceCannotFinalizeError);
    });

    it('should allow finalization if all WorkItems are resolved', () => {
      maintenance.checkin();
      const workItem = maintenance.addWorkItem({
        type: WorkItemType.MECHANIC,
        description: 'Oil change',
        estimatedValue: 150,
        correlationId,
      });

      maintenance.submitForApproval();

      // Reject the work item (makes it resolved)
      maintenance.rejectWorkItem({
        workItemId: workItem.id.value,
        reason: 'Too expensive',
        correlationId,
      });

      expect(workItem.status).toBe(WorkItemStatus.REJECTED);
      expect(() => maintenance.finalize()).not.toThrow();
      expect(maintenance.status).toBe(MaintenanceStatus.COMPLETED);
    });

    it('should prevent modifications after finalization', () => {
      maintenance.finalize(); // no work items, so it resolves immediately

      expect(() => maintenance.checkin()).toThrow(MaintenanceAlreadyClosedError);
      expect(() =>
        maintenance.addWorkItem({
          type: WorkItemType.MECHANIC,
          description: 'Late addition',
          estimatedValue: 100,
          correlationId,
        }),
      ).toThrow(MaintenanceAlreadyClosedError);
    });
  });

  describe('WorkItem Approval Flow', () => {
    it('should correctly approve a WorkItem and emit events', () => {
      const workItem = maintenance.addWorkItem({
        type: WorkItemType.ELECTRIC,
        description: 'Battery replacement',
        estimatedValue: 400,
        correlationId,
      });

      // Submit for approval
      maintenance.submitForApproval();
      expect(workItem.status).toBe(WorkItemStatus.AWAITING_APPROVAL);

      // Clear events so we can check the approval event easily
      maintenance.clearEvents();

      // Approve
      maintenance.approveWorkItem({
        workItemId: workItem.id.value,
        approvedBy: 'client-user',
        correlationId,
      });

      expect(workItem.status).toBe(WorkItemStatus.APPROVED);
      const approval = maintenance.approvals.find((a) => a.workItemId.equals(workItem.id));
      expect(approval?.isDecided()).toBe(true);

      expect(maintenance.domainEvents.length).toBe(1);
      expect(maintenance.domainEvents[0].eventType).toBe('WorkItemApproved');
    });
  });

  describe('Execution Flow', () => {
    it('should prevent starting execution on a WorkItem not in APPROVED state', () => {
      const workItem = maintenance.addWorkItem({
        type: WorkItemType.MECHANIC,
        description: 'Engine fix',
        estimatedValue: 2000,
        correlationId,
      });

      expect(() => maintenance.startWorkItemExecution(workItem.id.value)).toThrow();
    });

    it('should complete execution and record actual costs', () => {
      const workItem = maintenance.addWorkItem({
        type: WorkItemType.MECHANIC,
        description: 'Engine fix',
        estimatedValue: 2000,
        correlationId,
      });

      maintenance.submitForApproval();

      maintenance.approveWorkItem({
        workItemId: workItem.id.value,
        approvedBy: 'client',
        correlationId,
      });

      maintenance.startWorkItemExecution(workItem.id.value);
      expect(workItem.status).toBe(WorkItemStatus.IN_EXECUTION);
      expect(maintenance.status).toBe(MaintenanceStatus.IN_EXECUTION);

      maintenance.completeWorkItem({
        workItemId: workItem.id.value,
        actualValue: 2100, // Costs slightly more
        correlationId,
      });

      expect(workItem.status).toBe(WorkItemStatus.COMPLETED);
      expect(workItem.actualValue).toBe(2100);
      expect(maintenance.totalActualValue()).toBe(2100);
    });
  });
});
