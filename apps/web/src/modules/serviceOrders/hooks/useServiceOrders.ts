import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceOrderService } from '../services/serviceOrderService';
import { CreateServiceOrderDTO, ServiceOrderStatus } from '../types';

export function useServiceOrders(page = 1, limit = 10, filters = {}) {
  return useQuery({
    queryKey: ['service-orders', { page, limit, ...filters }],
    queryFn: () => serviceOrderService.list(page, limit, filters),
  });
}

export function useServiceOrder(id: string) {
  return useQuery({
    queryKey: ['service-orders', id],
    queryFn: () => serviceOrderService.getById(id),
    enabled: !!id,
  });
}

export function useCreateServiceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateServiceOrderDTO) => serviceOrderService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
    },
  });
}

export function useUpdateServiceOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ServiceOrderStatus }) => 
      serviceOrderService.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      queryClient.invalidateQueries({ queryKey: ['service-orders', variables.id] });
    },
  });
}
