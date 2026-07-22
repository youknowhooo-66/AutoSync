import api from '@/services/api';
import type { ServiceOrderCompletionReadiness } from '../types/completion.types';

export const completionService = {
  async getReadiness(serviceOrderId: string): Promise<ServiceOrderCompletionReadiness> {
    const response = await api.get(`/os/${serviceOrderId}`);
    const os = response.data.data || response.data;
    
    const hasItems = Array.isArray(os?.items) && os.items.length > 0;
    const isApproved = os?.status === 'APPROVED' || os?.status === 'IN_PROGRESS' || os?.status === 'FINISHED';
    
    return {
      serviceOrderId,
      overallReady: hasItems && isApproved,
      hasDiagnosis: !!os?.diagnosis,
      isApproved,
      servicesCompleted: os?.status === 'IN_PROGRESS' || os?.status === 'FINISHED',
      partsConsumed: hasItems,
      financeCleared: true,
      pendingItems: hasItems ? [] : ['Nenhum serviço/peça adicionado à OS.'],
    };
  },

  async complete(serviceOrderId: string, completionNotes: string): Promise<any> {
    const response = await api.put(`/os/${serviceOrderId}/status`, {
      status: 'FINISHED',
      notes: completionNotes,
    });
    return response.data.data || response.data;
  }
};
