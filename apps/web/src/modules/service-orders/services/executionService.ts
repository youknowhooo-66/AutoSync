import api from '@/services/api';
import type { OSServiceExecution } from '../types/execution.types';

export const executionService = {
  async getExecution(serviceOrderId: string): Promise<OSServiceExecution[]> {
    const response = await api.get(`/os/${serviceOrderId}`);
    const os = response.data.data || response.data;
    if (!os || !Array.isArray(os.items)) return [];

    return os.items
      .filter((item: any) => item.serviceId || item.service)
      .map((item: any) => ({
        id: item.id,
        serviceOrderId,
        serviceId: item.serviceId || item.id,
        serviceName: item.service?.name || item.name || 'Serviço Técnico',
        status: os.status === 'FINISHED' ? 'COMPLETED' : os.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'PENDING',
        technicianId: os.mechanicId || os.mechanic?.id,
        technicianName: os.mechanic?.name || 'Mecânico Alocado',
      }));
  },

  async assign(serviceOrderId: string, serviceId: string, technicianId: string): Promise<OSServiceExecution> {
    const response = await api.put(`/os/${serviceOrderId}/status`, { mechanicId: technicianId });
    return {
      id: serviceId,
      serviceOrderId,
      serviceId,
      serviceName: 'Serviço Alocado',
      status: 'PENDING',
      technicianId,
    };
  },

  async start(serviceOrderId: string, serviceId: string): Promise<OSServiceExecution> {
    await api.put(`/os/${serviceOrderId}/status`, { status: 'IN_PROGRESS' });
    return {
      id: serviceId,
      serviceOrderId,
      serviceId,
      serviceName: 'Serviço em Execução',
      status: 'IN_PROGRESS',
    };
  },

  async pause(serviceOrderId: string, serviceId: string, reason: string): Promise<OSServiceExecution> {
    await api.put(`/os/${serviceOrderId}/status`, { notes: `Pausado: ${reason}` });
    return {
      id: serviceId,
      serviceOrderId,
      serviceId,
      serviceName: 'Serviço Pausado',
      status: 'PAUSED',
    };
  },

  async resume(serviceOrderId: string, serviceId: string): Promise<OSServiceExecution> {
    await api.put(`/os/${serviceOrderId}/status`, { status: 'IN_PROGRESS' });
    return {
      id: serviceId,
      serviceOrderId,
      serviceId,
      serviceName: 'Serviço Retomado',
      status: 'IN_PROGRESS',
    };
  },

  async complete(serviceOrderId: string, serviceId: string, notes?: string): Promise<OSServiceExecution> {
    await api.put(`/os/${serviceOrderId}/status`, { notes });
    return {
      id: serviceId,
      serviceOrderId,
      serviceId,
      serviceName: 'Serviço Concluído',
      status: 'COMPLETED',
    };
  }
};
