import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceOrderFinanceService } from '../services/serviceOrderFinanceService';

export const serviceOrderFinanceKeys = {
  all: ['service-order-finance'] as const,
  byServiceOrder: (serviceOrderId: string) =>
    [...serviceOrderFinanceKeys.all, serviceOrderId] as const,
};

export function useServiceOrderFinance(serviceOrderId: string) {
  const queryClient = useQueryClient();

  const financeQuery = useQuery({
    queryKey: serviceOrderFinanceKeys.byServiceOrder(serviceOrderId),
    queryFn: () => serviceOrderFinanceService.getState(serviceOrderId),
    enabled: !!serviceOrderId,
    retry: false
  });

  const generateMutation = useMutation({
    mutationFn: (dueDate: string) =>
      serviceOrderFinanceService.generateReceivable(serviceOrderId, dueDate),
    onSuccess: () => {
      // Invalidate this OS finance state
      queryClient.invalidateQueries({
        queryKey: serviceOrderFinanceKeys.byServiceOrder(serviceOrderId)
      });
      // Invalidate OS details
      queryClient.invalidateQueries({
        queryKey: ['os-detail', serviceOrderId]
      });
      // Invalidate list of service orders
      queryClient.invalidateQueries({
        queryKey: ['service-orders']
      });
      // Invalidate invoice lists in the finance module
      queryClient.invalidateQueries({
        queryKey: ['invoices-list']
      });
    }
  });

  return {
    financeState: financeQuery.data,
    isLoading: financeQuery.isLoading,
    isError: financeQuery.isError,
    error: financeQuery.error,
    refetch: financeQuery.refetch,
    generateReceivable: generateMutation.mutateAsync,
    isGenerating: generateMutation.isPending,
    generationError: generateMutation.error
  };
}
