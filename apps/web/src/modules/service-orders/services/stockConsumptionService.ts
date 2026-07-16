import api from '@/services/api';
import type { ServiceOrderPartConsumption } from '../types/stockConsumption.types';

export const stockConsumptionService = {
  async getPartsConsumption(serviceOrderId: string): Promise<ServiceOrderPartConsumption[]> {
    const response = await api.get(`/api/service-orders/${serviceOrderId}/parts/consumption`);
    return response.data.data;
  },

  async consume(
    serviceOrderId: string,
    partId: string,
    quantity: number,
    idempotencyKey: string
  ): Promise<any> {
    const response = await api.post(
      `/api/service-orders/${serviceOrderId}/parts/${partId}/consume`,
      { quantity },
      {
        headers: {
          'Idempotency-Key': idempotencyKey
        }
      }
    );
    return response.data.data;
  }
};
