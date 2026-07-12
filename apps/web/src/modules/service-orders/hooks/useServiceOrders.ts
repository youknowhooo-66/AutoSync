import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceOrderService } from '../services/serviceOrderService';
import type { CreateServiceOrderDTO } from '../services/serviceOrderService';

export const serviceOrderKeys = {
  all: ['service-orders'] as const,
  lists: () => [...serviceOrderKeys.all, 'list'] as const,
  details: () => [...serviceOrderKeys.all, 'detail'] as const,
  detail: (id: string) => [...serviceOrderKeys.details(), id] as const,
};

export function useServiceOrders() {
  return useQuery({
    queryKey: serviceOrderKeys.lists(),
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
