import api from '@/services/api';
import type { OSServiceExecution } from '../types/execution.types';

export const executionService = {
  async getExecution(serviceOrderId: string): Promise<OSServiceExecution[]> {
    const response = await api.get(`/api/service-orders/${serviceOrderId}/execution`);
    return response.data.data;
  },

  async assign(serviceOrderId: string, serviceId: string, technicianId: string): Promise<OSServiceExecution> {
    const response = await api.post(`/api/service-orders/${serviceOrderId}/services/${serviceId}/assign`, {
      technicianId
    });
    return response.data.data;
  },

  async start(serviceOrderId: string, serviceId: string): Promise<OSServiceExecution> {
    const response = await api.post(`/api/service-orders/${serviceOrderId}/services/${serviceId}/start`);
    return response.data.data;
  },

  async pause(serviceOrderId: string, serviceId: string, reason: string): Promise<OSServiceExecution> {
    const response = await api.post(`/api/service-orders/${serviceOrderId}/services/${serviceId}/pause`, {
      reason
    });
    return response.data.data;
  },

  async resume(serviceOrderId: string, serviceId: string): Promise<OSServiceExecution> {
    const response = await api.post(`/api/service-orders/${serviceOrderId}/services/${serviceId}/resume`);
    return response.data.data;
  },

  async complete(serviceOrderId: string, serviceId: string, notes?: string): Promise<OSServiceExecution> {
    const response = await api.post(`/api/service-orders/${serviceOrderId}/services/${serviceId}/complete`, {
      notes
    });
    return response.data.data;
  }
};
