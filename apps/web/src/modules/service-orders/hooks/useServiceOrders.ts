import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceOrderService } from '../services/serviceOrderService';
import type { CreateServiceOrderDTO } from '../services/serviceOrderService';
import { useBranch } from '@/contexts/BranchContext';

export const serviceOrderKeys = {
  all: ['service-orders'] as const,
  lists: (branchId?: string) => [...serviceOrderKeys.all, 'list', branchId] as const,
  details: () => [...serviceOrderKeys.all, 'detail'] as const,
  detail: (id: string) => [...serviceOrderKeys.details(), id] as const,
};

export function useServiceOrders() {
  const { activeBranch } = useBranch();

  return useQuery({
    queryKey: serviceOrderKeys.lists(activeBranch?.id),
    queryFn: () => serviceOrderService.list(),
  });
}

export function useServiceOrder(id: string) {
  return useQuery({
    queryKey: serviceOrderKeys.detail(id),
    queryFn: () => serviceOrderService.getById(id),
    enabled: !!id,
  });
}

export function useCreateServiceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateServiceOrderDTO) => serviceOrderService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceOrderKeys.all });
    },
  });
}
