import { useQuery } from '@tanstack/react-query';
import { useTenant } from '@/modules/auth/hooks/useTenant';
import api from '@/services/api';

export function useDashboardMetrics() {
  const { tenantId } = useTenant();

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard_metrics', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      const response = await api.get('/dashboard');
      return response.data;
    },
    refetchInterval: 10000,
    enabled: !!tenantId
  });

  return {
    dataset: data,
    isLoading,
    error
  };
}
