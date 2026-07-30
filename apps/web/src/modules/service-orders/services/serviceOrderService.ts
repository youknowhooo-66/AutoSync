import api from '@/services/api';
import type { ServiceOrder } from '../types/serviceOrder.types';

export interface CreateServiceOrderDTO {
  clientId: string;
  vehicleId: string;
  branchId: string;
  mechanicId?: string | null;
  notes?: string;
}

export const serviceOrderService = {
  async list() {
    const { data } = await api.get<ServiceOrder[]>('/os');
    return Array.isArray(data) ? data : (data as any)?.items || [];
  },

  async getById(id: string) {
    const { data } = await api.get<any>(`/os/${id}`);
    return data?.data || data;
  },

  async create(payload: CreateServiceOrderDTO) {
    const { data } = await api.post<any>('/os', payload);
    return data?.data || data;
  },
};
