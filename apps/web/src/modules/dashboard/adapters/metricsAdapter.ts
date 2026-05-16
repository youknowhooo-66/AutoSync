import type { TenantMetricsData, KPIResult } from '@/core/metrics/metricsTypes';
import { evaluateSystemHealth, type HealthEvaluation } from '../utils/healthEvaluator';

export interface DashboardDataset {
  health: HealthEvaluation;
  kpis: {
    totalRevenue: number;
    avgCompletionTimeHours: number;
    conversionRate: number;
    cancellationRate: number;
    stockMovements: number;
  };
  funnel: {
    created: number;
    completed: number;
    invoiced: number;
    paid: number;
  };
  raw: TenantMetricsData;
}

export function adaptMetricsForDashboard(raw: TenantMetricsData, kpis: KPIResult): DashboardDataset {
  return {
    health: evaluateSystemHealth(raw, kpis),
    kpis: {
      totalRevenue: raw.revenueTotal,
      avgCompletionTimeHours: kpis.avgOsCompletionTimeMs / (1000 * 60 * 60),
      conversionRate: kpis.conversionRate * 100,
      cancellationRate: kpis.cancellationRate * 100,
      stockMovements: raw.stockMovements
    },
    funnel: {
      created: raw.osCreated,
      completed: raw.osCompleted,
      invoiced: raw.invoiceCreatedCount,
      paid: raw.invoicePaidCount
    },
    raw
  };
}
