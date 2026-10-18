import api from '@/services/api';
import type { ServiceOrderCompletionReadiness } from '../types/completion.types';

export const completionService = {
  async getReadiness(serviceOrderId: string): Promise<ServiceOrderCompletionReadiness> {
    const response = await api.get(`/os/${serviceOrderId}/completion/readiness`);
    return response.data.data;
  },

  async complete(serviceOrderId: string, completionNotes: string): Promise<any> {
    const response = await api.post(`/os/${serviceOrderId}/complete`, {
      completionNotes
    });
    return response.data.data;
  }
};
