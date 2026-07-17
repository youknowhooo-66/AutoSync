import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { completionService } from '../services/completionService';

export const completionKeys = {
  all: ['service-order-completion'] as const,
  readiness: (serviceOrderId: string) =>
    [...completionKeys.all, 'readiness', serviceOrderId] as const,
};

export function useServiceOrderCompletion(serviceOrderId: string) {
  const queryClient = useQueryClient();

  const readinessQuery = useQuery({
    queryKey: completionKeys.readiness(serviceOrderId),
    queryFn: () => completionService.getReadiness(serviceOrderId),
    enabled: !!serviceOrderId,
    retry: false
  });

  const completeMutation = useMutation({
    mutationFn: (completionNotes: string) =>
      completionService.complete(serviceOrderId, completionNotes),
    onSuccess: () => {
      // Invalidate readiness query
      queryClient.invalidateQueries({
        queryKey: completionKeys.readiness(serviceOrderId)
      });
      // Invalidate OS details
      queryClient.invalidateQueries({
        queryKey: ['os-detail', serviceOrderId]
      });
      // Invalidate execution status queries
      queryClient.invalidateQueries({
        queryKey: ['service-order-execution', serviceOrderId]
      });
      // Invalidate stock consumption queries
      queryClient.invalidateQueries({
        queryKey: ['service-order-stock-consumption', serviceOrderId]
      });
      // Invalidate list of service orders
      queryClient.invalidateQueries({
        queryKey: ['service-orders']
      });
    }
  });

  return {
    readiness: readinessQuery.data,
    isLoadingReadiness: readinessQuery.isLoading,
    isErrorReadiness: readinessQuery.isError,
    errorReadiness: readinessQuery.error,
    refetchReadiness: readinessQuery.refetch,
    complete: completeMutation.mutateAsync,
    isCompleting: completeMutation.isPending,
    completionError: completeMutation.error
  };
}
