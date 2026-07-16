import { useMutation, useQueryClient } from '@tanstack/react-query';
import { diagnosisService } from '../services/diagnosisService';
import { toast } from 'sonner';

export const diagnosisKeys = {
  all: ['diagnosis'] as const,
  byServiceOrder: (serviceOrderId: string) =>
    [...diagnosisKeys.all, 'service-order', serviceOrderId] as const,
};

export function useRegisterDiagnosis(serviceOrderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (description: string) =>
      diagnosisService.registerDiagnosis(serviceOrderId, description),
    onSuccess: (data) => {
      toast.success('Diagnóstico registrado com sucesso!');
      
      // Invalidate target queries
      queryClient.invalidateQueries({ queryKey: diagnosisKeys.byServiceOrder(serviceOrderId) });
      queryClient.invalidateQueries({ queryKey: ['os-detail', serviceOrderId] });
      queryClient.invalidateQueries({ queryKey: ['os-list'] });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Erro ao registrar diagnóstico.';
      toast.error(msg);
    },
  });
}
