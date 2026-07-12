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
    return data;
  },

  async getById(id: string) {
    const { data } = await api.get<ServiceOrder>(`/os/${id}`);
    return data;
  },

  async create(payload: CreateServiceOrderDTO) {
    const { data } = await api.post<{ success: true; data: ServiceOrder }>('/os', payload);
    return data.data;
  },
};
