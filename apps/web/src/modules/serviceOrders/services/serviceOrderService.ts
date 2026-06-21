import { api } from '../../../lib/axios';
import { ServiceOrder, CreateServiceOrderDTO, ServiceOrderListResponse, ServiceOrderStatus } from '../types';

export const serviceOrderService = {
  async list(page = 1, limit = 10, filters: any = {}) {
    const { data } = await api.get<ServiceOrderListResponse>('/service-orders', {
      params: { page, limit, ...filters },
    });
    return data;
  },

  async getById(id: string) {
    const { data } = await api.get<{ success: true; data: ServiceOrder }>(`/service-orders/${id}`);
    return data.data;
  },

  async create(payload: CreateServiceOrderDTO) {
    const { data } = await api.post<{ success: true; data: ServiceOrder }>('/service-orders', payload);
    return data.data;
  },

  async updateStatus(id: string, status: ServiceOrderStatus) {
    const { data } = await api.patch<{ success: true; data: ServiceOrder }>(`/service-orders/${id}/status`, { status });
    return data.data;
  },

  async delete(id: string) {
    await api.delete(`/service-orders/${id}`);
  },
};
