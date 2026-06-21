import type { TenantMetricsData, KPIResult } from './metricsTypes';

export function calculateKPIs(metrics: TenantMetricsData): KPIResult {
  const { tenantId, osCreated, osCompleted, osCanceled, invoicePaidCount, revenueTotal, totalOsCompletionTimeMs } = metrics;

  // 1. Average OS Completion Time
  const avgOsCompletionTimeMs = osCompleted > 0 ? totalOsCompletionTimeMs / osCompleted : 0;

  // 2. Revenue per OS (Completed)
  const revenuePerOs = osCompleted > 0 ? revenueTotal / osCompleted : 0;

  // 3. Conversion Rate (OS Created -> Invoice Paid)
  const conversionRate = osCreated > 0 ? invoicePaidCount / osCreated : 0;

  // 4. Cancellation Rate
  const cancellationRate = osCreated > 0 ? osCanceled / osCreated : 0;

  return {
    tenantId,
    avgOsCompletionTimeMs,
    revenuePerOs,
    conversionRate,
    cancellationRate
  };
}
