import api from '@/services/api';
import type { ServiceOrderFinanceState } from '../types/serviceOrderFinance.types';

export const serviceOrderFinanceService = {
  async getState(serviceOrderId: string): Promise<ServiceOrderFinanceState> {
    const response = await api.get(`/api/service-orders/${serviceOrderId}/finance`);
    return response.data.data;
  },

  async generateReceivable(serviceOrderId: string, dueDate: string): Promise<any> {
    const response = await api.post(`/api/service-orders/${serviceOrderId}/finance/receivable`, {
      dueDate
    });
    return response.data.data;
  }
};
