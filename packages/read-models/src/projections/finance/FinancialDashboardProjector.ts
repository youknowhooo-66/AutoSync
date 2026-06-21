import { MeasurementGeneratedV1, InvoiceIssuedV1, WorkItemCompletedV1 } from '@autosync/domain';
import {
  AccountReceivableCreatedV1,
  AccountPayableCreatedV1,
} from '../../events/ProjectionEvents';
import { IProjectionStore } from '../../repositories';
import { IProjectionIdempotencyTracker, withProjectionIdempotency } from '../shared/ProjectionIdempotency';
import { FinancialDashboardView } from '../../views';

export class FinancialDashboardProjector {
  constructor(
    private readonly store: IProjectionStore,
    private readonly idempotency: IProjectionIdempotencyTracker,
  ) {}

  async onMeasurementGenerated(event: MeasurementGeneratedV1): Promise<void> {
    await withProjectionIdempotency(
      this.idempotency,
      event.eventId,
      'FinancialDashboard:onMeasurementGenerated',
      async () => {
        const view = await this.getOrCreate(event.companyId, event.timestamp);
        const totalRevenue = view.totalRevenue + event.payload.totalValue;

        await this.store.financialDashboard.upsert(event.companyId, {
          ...view,
          totalRevenue,
          grossMargin: totalRevenue - view.totalCosts,
          lastUpdatedAt: event.timestamp,
        });
      },
    );
  }

  async onInvoiceIssued(event: InvoiceIssuedV1): Promise<void> {
    await withProjectionIdempotency(
      this.idempotency,
      event.eventId,
      'FinancialDashboard:onInvoiceIssued',
      async () => {
        const view = await this.getOrCreate(event.companyId, event.timestamp);

        await this.store.financialDashboard.upsert(event.companyId, {
          ...view,
          invoicesIssued: view.invoicesIssued + 1,
          lastUpdatedAt: event.timestamp,
        });
      },
    );
  }

  async onAccountReceivableCreated(event: AccountReceivableCreatedV1): Promise<void> {
    await withProjectionIdempotency(
      this.idempotency,
      event.eventId,
      'FinancialDashboard:onAccountReceivableCreated',
      async () => {
        const view = await this.getOrCreate(event.companyId, event.timestamp);

        await this.store.financialDashboard.upsert(event.companyId, {
          ...view,
          accountsReceivable: view.accountsReceivable + event.payload.amount,
          lastUpdatedAt: event.timestamp,
        });
      },
    );
  }

  async onAccountPayableCreated(event: AccountPayableCreatedV1): Promise<void> {
    await withProjectionIdempotency(
      this.idempotency,
      event.eventId,
      'FinancialDashboard:onAccountPayableCreated',
      async () => {
        const view = await this.getOrCreate(event.companyId, event.timestamp);

        await this.store.financialDashboard.upsert(event.companyId, {
          ...view,
          accountsPayable: view.accountsPayable + event.payload.amount,
          lastUpdatedAt: event.timestamp,
        });
      },
    );
  }

  async onWorkItemCompleted(event: WorkItemCompletedV1): Promise<void> {
    await withProjectionIdempotency(
      this.idempotency,
      event.eventId,
      'FinancialDashboard:onWorkItemCompleted',
      async () => {
        const view = await this.getOrCreate(event.companyId, event.timestamp);
        const totalCosts = view.totalCosts + event.payload.totalCost;

        await this.store.financialDashboard.upsert(event.companyId, {
          ...view,
          totalCosts,
          grossMargin: view.totalRevenue - totalCosts,
          lastUpdatedAt: event.timestamp,
        });
      },
    );
  }

  private async getOrCreate(
    companyId: string,
    timestamp: Date,
  ): Promise<FinancialDashboardView> {
    const existing = await this.store.financialDashboard.get(companyId);
    if (existing) return existing;

    return {
      companyId,
      totalRevenue: 0,
      totalCosts: 0,
      grossMargin: 0,
      invoicesIssued: 0,
      accountsReceivable: 0,
      accountsPayable: 0,
      lastUpdatedAt: timestamp,
    };
  }
}
