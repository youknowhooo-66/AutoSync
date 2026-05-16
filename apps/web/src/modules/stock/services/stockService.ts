import { api } from '../../../lib/axios';
import { StockItem, StockMovement, StockSummary } from '../types';

export const stockService = {
  async list(page = 1, limit = 10, search = '') {
    const { data } = await api.get<{ success: true; data: StockItem[]; pagination: any }>('/stock', {
      params: { page, limit, search },
    });
    return data;
  },

  async getSummary() {
    const { data } = await api.get<{ success: true; data: StockSummary }>('/stock/summary');
    return data.data;
  },

  async getMovements(page = 1, limit = 20) {
    const { data } = await api.get<{ success: true; data: StockMovement[]; pagination: any }>('/stock/movements', {
      params: { page, limit },
    });
    return data;
  },

  async getById(id: string) {
    const { data } = await api.get<{ success: true; data: StockItem }>(`/stock/${id}`);
    return data.data;
  },
};
