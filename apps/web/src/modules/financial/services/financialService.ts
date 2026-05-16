import { api } from '../../../lib/axios';
import { FinancialAnalytics } from '../types';

export const financialService = {
  async getDashboardData(range: string = '30d') {
    const { data } = await api.get<{ success: true; data: FinancialAnalytics }>('/financial/dashboard', {
      params: { range },
    });
    return data.data;
  },

  async getReport(filters: any) {
    const { data } = await api.get('/financial/reports', {
      params: filters,
    });
    return data;
  },
};
