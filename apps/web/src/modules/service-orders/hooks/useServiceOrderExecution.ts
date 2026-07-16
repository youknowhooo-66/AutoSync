import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { executionService } from '../services/executionService';

export function useServiceOrderExecution(serviceOrderId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['serviceOrderExecution', serviceOrderId],
    queryFn: () => executionService.getExecution(serviceOrderId),
    enabled: !!serviceOrderId
  });

  const assignMutation = useMutation({
    mutationFn: ({ serviceId, technicianId }: { serviceId: string; technicianId: string }) =>
      executionService.assign(serviceOrderId, serviceId, technicianId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceOrderExecution', serviceOrderId] });
    }
  });

  const startMutation = useMutation({
    mutationFn: (serviceId: string) => executionService.start(serviceOrderId, serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceOrderExecution', serviceOrderId] });
    }
  });

  const pauseMutation = useMutation({
    mutationFn: ({ serviceId, reason }: { serviceId: string; reason: string }) =>
      executionService.pause(serviceOrderId, serviceId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceOrderExecution', serviceOrderId] });
    }
  });

  const resumeMutation = useMutation({
    mutationFn: (serviceId: string) => executionService.resume(serviceOrderId, serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceOrderExecution', serviceOrderId] });
    }
  });

  const completeMutation = useMutation({
    mutationFn: ({ serviceId, notes }: { serviceId: string; notes?: string }) =>
      executionService.complete(serviceOrderId, serviceId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceOrderExecution', serviceOrderId] });
    }
  });

  return {
    execution: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    assign: assignMutation.mutateAsync,
    isAssigning: assignMutation.isPending,
    start: startMutation.mutateAsync,
    isStarting: startMutation.isPending,
    pause: pauseMutation.mutateAsync,
    isPausing: pauseMutation.isPending,
    resume: resumeMutation.mutateAsync,
    isResuming: resumeMutation.isPending,
    complete: completeMutation.mutateAsync,
    isCompleting: completeMutation.isPending
  };
}
