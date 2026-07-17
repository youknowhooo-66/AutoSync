import { api } from '../../../lib/axios';
import type { Vehicle, CreateVehicleDTO } from '../types';

export const vehicleService = {
  async list(page = 1, limit = 10, search = '') {
    const { data } = await api.get<Vehicle[]>('/vehicles', {
      params: { page, limit, search },
    });
    return data;
  },

  async getById(id: string) {
    const { data } = await api.get<{ success: true; data: Vehicle }>(`/vehicles/${id}`);
    return data.data;
  },

  async create(payload: CreateVehicleDTO) {
    const { data } = await api.post<{ success: true; data: Vehicle }>('/vehicles', payload);
    return data.data;
  },

  async update(id: string, payload: Partial<CreateVehicleDTO>) {
    const { data } = await api.put<{ success: true; data: Vehicle }>(`/vehicles/${id}`, payload);
    return data.data;
  },

  async delete(id: string) {
    await api.delete(`/vehicles/${id}`);
  },
};
