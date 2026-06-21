import { TimeEntryRegisteredV1, WorkItemCompletedV1 } from '@autosync/domain';
import { IProjectionStore } from '../../repositories';
import { IReferenceDataLookup } from '../shared/ReferenceDataLookup';
import { IProjectionIdempotencyTracker, withProjectionIdempotency } from '../shared/ProjectionIdempotency';
import { TechnicianProductivityView } from '../../views';

export class TechnicianProductivityProjector {
  constructor(
    private readonly store: IProjectionStore,
    private readonly referenceData: IReferenceDataLookup,
    private readonly idempotency: IProjectionIdempotencyTracker,
  ) {}

  async onTimeEntryRegistered(event: TimeEntryRegisteredV1): Promise<void> {
    await withProjectionIdempotency(
      this.idempotency,
      event.eventId,
      'TechnicianProductivity:onTimeEntryRegistered',
      async () => {
        const { workItemId, hours } = event.payload;
        const technicianId = this.referenceData.getTechnicianForWorkItem(workItemId);
        if (!technicianId) return;

        const view = await this.getOrCreate(technicianId, event.companyId, event.timestamp);
        const totalHoursWorked = view.totalHoursWorked + hours;

        await this.store.technicianProductivity.upsert(technicianId, {
          ...view,
          totalHoursWorked,
          averageExecutionHours: this.computeAverage(totalHoursWorked, view.completedWorkItems),
          productivityScore: this.computeScore(view.completedWorkItems, totalHoursWorked),
          lastUpdatedAt: event.timestamp,
        });
      },
    );
  }

  async onWorkItemCompleted(event: WorkItemCompletedV1): Promise<void> {
    await withProjectionIdempotency(
      this.idempotency,
      event.eventId,
      'TechnicianProductivity:onWorkItemCompleted',
      async () => {
        const { workItemId } = event.payload;
        const technicianId = this.referenceData.getTechnicianForWorkItem(workItemId);
        if (!technicianId) return;

        const view = await this.getOrCreate(technicianId, event.companyId, event.timestamp);
        const completedWorkItems = view.completedWorkItems + 1;

        await this.store.technicianProductivity.upsert(technicianId, {
          ...view,
          completedWorkItems,
          averageExecutionHours: this.computeAverage(view.totalHoursWorked, completedWorkItems),
          productivityScore: this.computeScore(completedWorkItems, view.totalHoursWorked),
          lastUpdatedAt: event.timestamp,
        });
      },
    );
  }

  private async getOrCreate(
    technicianId: string,
    companyId: string,
    timestamp: Date,
  ): Promise<TechnicianProductivityView> {
    const existing = await this.store.technicianProductivity.get(technicianId);
    if (existing) return existing;

    return {
      technicianId,
      companyId,
      totalHoursWorked: 0,
      completedWorkItems: 0,
      averageExecutionHours: 0,
      productivityScore: 0,
      lastUpdatedAt: timestamp,
    };
  }

  private computeAverage(totalHours: number, completedItems: number): number {
    if (completedItems === 0) return 0;
    return Math.round((totalHours / completedItems) * 100) / 100;
  }

  private computeScore(completedItems: number, totalHours: number): number {
    if (totalHours === 0) return completedItems * 10;
    return Math.round((completedItems / totalHours) * 100) / 100;
  }
}
