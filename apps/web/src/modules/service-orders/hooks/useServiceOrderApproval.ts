import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { approvalService } from '../services/approvalService';
import { serviceOrderKeys } from './useServiceOrders';
import { serviceOrderItemKeys } from './useServiceOrderItems';
import { toast } from 'sonner';

export const approvalKeys = {
  all: ['service-order-approval'] as const,
  byServiceOrder: (serviceOrderId: string) => [...approvalKeys.all, serviceOrderId] as const,
};

export function useServiceOrderApproval(serviceOrderId: string) {
  return useQuery({
    queryKey: approvalKeys.byServiceOrder(serviceOrderId),
    queryFn: () => approvalService.getByServiceOrder(serviceOrderId),
    enabled: !!serviceOrderId,
  });
}

export function useRequestApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (serviceOrderId: string) => approvalService.requestApproval(serviceOrderId),
    onSuccess: (data, serviceOrderId) => {
      toast.success('Solicitação de aprovação enviada com sucesso');
      queryClient.invalidateQueries({ queryKey: approvalKeys.byServiceOrder(serviceOrderId) });
      queryClient.invalidateQueries({ queryKey: serviceOrderKeys.detail(serviceOrderId) });
      queryClient.invalidateQueries({ queryKey: serviceOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: serviceOrderItemKeys.byServiceOrder(serviceOrderId) });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Falha ao solicitar aprovação');
    }
  });
}

export function useApproveServiceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { serviceOrderId: string; approvalId: string }) =>
      approvalService.approve(payload),
    onSuccess: (data, variables) => {
      toast.success('Orçamento aprovado com sucesso');
      queryClient.invalidateQueries({ queryKey: approvalKeys.byServiceOrder(variables.serviceOrderId) });
      queryClient.invalidateQueries({ queryKey: serviceOrderKeys.detail(variables.serviceOrderId) });
      queryClient.invalidateQueries({ queryKey: serviceOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: serviceOrderItemKeys.byServiceOrder(variables.serviceOrderId) });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Falha ao aprovar orçamento');
    }
  });
}

export function useRejectServiceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { serviceOrderId: string; approvalId: string; reason: string }) =>
      approvalService.reject(payload),
    onSuccess: (data, variables) => {
      toast.success('Orçamento rejeitado');
      queryClient.invalidateQueries({ queryKey: approvalKeys.byServiceOrder(variables.serviceOrderId) });
      queryClient.invalidateQueries({ queryKey: serviceOrderKeys.detail(variables.serviceOrderId) });
      queryClient.invalidateQueries({ queryKey: serviceOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: serviceOrderItemKeys.byServiceOrder(variables.serviceOrderId) });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Falha ao rejeitar orçamento');
    }
  });
}

export function useInvalidateApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { serviceOrderId: string; approvalId: string; reason: string }) =>
      approvalService.invalidate(payload),
    onSuccess: (data, variables) => {
      toast.success('Aprovação invalidada com sucesso');
      queryClient.invalidateQueries({ queryKey: approvalKeys.byServiceOrder(variables.serviceOrderId) });
      queryClient.invalidateQueries({ queryKey: serviceOrderKeys.detail(variables.serviceOrderId) });
      queryClient.invalidateQueries({ queryKey: serviceOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: serviceOrderItemKeys.byServiceOrder(variables.serviceOrderId) });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Falha ao invalidar aprovação');
    }
  });
}
