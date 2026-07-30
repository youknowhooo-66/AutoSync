import api from '@/services/api';
import type { ServiceOrderPartConsumption } from '../types/stockConsumption.types';

export const stockConsumptionService = {
  async getPartsConsumption(serviceOrderId: string): Promise<ServiceOrderPartConsumption[]> {
    const response = await api.get(`/os/${serviceOrderId}`);
    const os = response.data.data || response.data;
    if (!os || !Array.isArray(os.items)) return [];

    return os.items
      .filter((item: any) => item.partId || item.part)
      .map((item: any) => ({
        id: item.id,
        serviceOrderId,
        partId: item.partId || item.id,
        partName: item.part?.name || item.name || 'Peça Técnica',
        quantity: Number(item.quantity || 1),
        consumed: true,
      }));
  },

  async consume(
    serviceOrderId: string,
    partId: string,
    quantity: number,
    idempotencyKey: string
  ): Promise<any> {
    const response = await api.post(`/inventory/parts`, {
      partId,
      quantity,
      type: 'OUT',
      reason: `Consumo na OS #${serviceOrderId}`,
    }, {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    });
    return response.data.data || response.data;
  }
};
