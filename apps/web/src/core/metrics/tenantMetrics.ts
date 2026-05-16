import type { TenantMetricsData } from './metricsTypes';

export function createEmptyTenantMetrics(tenantId: string): TenantMetricsData {
  return {
    tenantId,
    osCreated: 0,
    osCompleted: 0,
    osCanceled: 0,
    invoiceCreatedCount: 0,
    invoicePaidCount: 0,
    revenueTotal: 0,
    stockMovements: 0,
    totalOsCompletionTimeMs: 0
  };
}
