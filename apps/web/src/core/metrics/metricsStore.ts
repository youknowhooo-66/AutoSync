import { create } from 'zustand';
import type { TenantMetricsData } from './metricsTypes';
import { createEmptyTenantMetrics } from './tenantMetrics';

interface MetricsState {
  metricsByTenant: Record<string, TenantMetricsData>;
  updateTenantMetrics: (tenantId: string, partial: Partial<TenantMetricsData>) => void;
  incrementMetric: (tenantId: string, key: keyof TenantMetricsData, amount?: number) => void;
}

export const useMetricsStore = create<MetricsState>((set) => ({
  metricsByTenant: {},

  updateTenantMetrics: (tenantId, partial) => set((state) => {
    const current = state.metricsByTenant[tenantId] || createEmptyTenantMetrics(tenantId);
    return {
      metricsByTenant: {
        ...state.metricsByTenant,
        [tenantId]: { ...current, ...partial }
      }
    };
  }),

  incrementMetric: (tenantId, key, amount = 1) => set((state) => {
    const current = state.metricsByTenant[tenantId] || createEmptyTenantMetrics(tenantId);
    return {
      metricsByTenant: {
        ...state.metricsByTenant,
        [tenantId]: {
          ...current,
          [key]: (current[key] as number) + amount
        }
      }
    };
  })
}));
