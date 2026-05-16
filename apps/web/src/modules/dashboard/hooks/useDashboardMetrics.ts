import { useQuery } from '@tanstack/react-query';
import { useTenant } from '@/modules/auth/hooks/useTenant';
import { metricsEngine } from '@/core/metrics/metricsEngine';
import { adaptMetricsForDashboard } from '../adapters/metricsAdapter';
import { createEmptyTenantMetrics } from '@/core/metrics/tenantMetrics';
import { calculateKPIs } from '@/core/metrics/kpiCalculator';

export function useDashboardMetrics() {
  const { tenantId } = useTenant();

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard_metrics', tenantId],
    queryFn: () => {
      if (!tenantId) return null;
      
      // We read directly from metricsEngine (which consumes Zustand store)
      const engineData = metricsEngine.getTenantDashboardData(tenantId);
      
      if (!engineData) {
        // Fallback to empty if not started
        const emptyRaw = createEmptyTenantMetrics(tenantId);
        return adaptMetricsForDashboard(emptyRaw, calculateKPIs(emptyRaw));
      }
      
      return adaptMetricsForDashboard(engineData.raw, engineData.kpis);
    },
    refetchInterval: 5000, // Poll memory state every 5s for smooth updates without triggering API calls
    enabled: !!tenantId
  });

  return {
    dataset: data,
    isLoading,
    error
  };
}
