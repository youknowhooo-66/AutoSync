import { useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceOrderItemService } from '../services/serviceOrderItemService';
import { serviceOrderKeys } from './useServiceOrders';
import type { AddServiceOrderItemPayload, RemoveServiceOrderItemPayload } from '../types/serviceOrderItem.types';
import { toast } from 'sonner';

export const serviceOrderItemKeys = {
  all: ['service-order-items'] as const,
  byServiceOrder: (serviceOrderId: string) =>
    [...serviceOrderItemKeys.all, serviceOrderId] as const,
};

export function useCreateServiceOrderItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddServiceOrderItemPayload) =>
      serviceOrderItemService.addItems(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: serviceOrderItemKeys.byServiceOrder(variables.serviceOrderId),
      });
      queryClient.invalidateQueries({
        queryKey: serviceOrderKeys.detail(variables.serviceOrderId),
      });
      queryClient.invalidateQueries({
        queryKey: serviceOrderKeys.lists(),
      });
      toast.success('Itens adicionados com sucesso.');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao adicionar item.');
    },
  });
}

export function useDeleteServiceOrderItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RemoveServiceOrderItemPayload) =>
      serviceOrderItemService.removeItem(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: serviceOrderItemKeys.byServiceOrder(variables.serviceOrderId),
      });
      queryClient.invalidateQueries({
        queryKey: serviceOrderKeys.detail(variables.serviceOrderId),
      });
      queryClient.invalidateQueries({
        queryKey: serviceOrderKeys.lists(),
      });
      toast.success('Item removido com sucesso.');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao remover item.');
    },
  });
}
