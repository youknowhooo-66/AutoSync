import { api } from '../../../lib/axios';
import type { Client, CreateClientDTO } from '../types';

export const clientService = {
  async list(page = 1, limit = 10, search = '') {
    const { data } = await api.get<Client[]>('/clients', {
      params: { page, limit, search },
    });
    return data;
  },

  async getById(id: string) {
    const { data } = await api.get<{ success: true; data: Client }>(`/clients/${id}`);
    return data.data;
  },

  async create(payload: CreateClientDTO) {
    const { data } = await api.post<{ success: true; data: Client }>('/clients', payload);
    return data.data;
  },

  async update(id: string, payload: Partial<CreateClientDTO>) {
    const { data } = await api.put<{ success: true; data: Client }>(`/clients/${id}`, payload);
    return data.data;
  },

  async delete(id: string) {
    await api.delete(`/clients/${id}`);
  },
};
