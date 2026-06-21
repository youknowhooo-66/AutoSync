import type { TenantMetricsData, KPIResult } from '@/core/metrics/metricsTypes';

export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'CRITICAL';

export interface HealthEvaluation {
  status: HealthStatus;
  score: number;
  warnings: string[];
}

export function evaluateSystemHealth(raw: TenantMetricsData, kpis: KPIResult): HealthEvaluation {
  let score = 100;
  const warnings: string[] = [];

  // Check OS Backlog (Created but not completed/canceled)
  const backlog = raw.osCreated - (raw.osCompleted + raw.osCanceled);
  if (backlog > 50) {
    score -= 20;
    warnings.push('Alto volume de Ordens de Serviço em aberto (Backlog).');
  }

  // Check Cancellation Rate
  if (kpis.cancellationRate > 0.15) {
    score -= 15;
    warnings.push('Taxa de cancelamento elevada (>15%).');
  }

  // Check Conversion Rate (OS to Paid Invoice)
  if (kpis.conversionRate < 0.5 && raw.osCreated > 10) {
    score -= 25;
    warnings.push('Baixa conversão de OS para Fatura Paga (<50%). Risco de fluxo de caixa.');
  }

  // Determine status based on score
  let status: HealthStatus = 'HEALTHY';
  if (score <= 50) {
    status = 'CRITICAL';
  } else if (score < 85) {
    status = 'DEGRADED';
  }

  return { status, score, warnings };
}
