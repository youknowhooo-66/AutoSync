import { useMetricsStore } from './metricsStore';

export class MetricsAggregator {
  
  incrementCounter(tenantId: string, metricName: 'osCreated' | 'osCompleted' | 'osCanceled' | 'invoiceCreatedCount' | 'invoicePaidCount' | 'stockMovements', amount = 1) {
    if (!tenantId) return;
    useMetricsStore.getState().incrementMetric(tenantId, metricName, amount);
  }

  addRevenue(tenantId: string, amount: number) {
    if (!tenantId) return;
    useMetricsStore.getState().incrementMetric(tenantId, 'revenueTotal', amount);
  }

  addCompletionTime(tenantId: string, durationMs: number) {
    if (!tenantId || durationMs <= 0) return;
    useMetricsStore.getState().incrementMetric(tenantId, 'totalOsCompletionTimeMs', durationMs);
  }
}

export const metricsAggregator = new MetricsAggregator();
