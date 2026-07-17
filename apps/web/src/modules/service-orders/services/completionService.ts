import api from '@/services/api';
import type { ServiceOrderCompletionReadiness } from '../types/completion.types';

export const completionService = {
  async getReadiness(serviceOrderId: string): Promise<ServiceOrderCompletionReadiness> {
    const response = await api.get(`/api/service-orders/${serviceOrderId}/completion/readiness`);
    return response.data.data;
  },

  async complete(serviceOrderId: string, completionNotes: string): Promise<any> {
    const response = await api.post(`/api/service-orders/${serviceOrderId}/complete`, {
      completionNotes
    });
    return response.data.data;
  }
};
