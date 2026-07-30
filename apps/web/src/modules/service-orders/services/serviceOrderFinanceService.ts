import api from '@/services/api';
import type { ServiceOrderFinanceState } from '../types/serviceOrderFinance.types';

export const serviceOrderFinanceService = {
  async getState(serviceOrderId: string): Promise<ServiceOrderFinanceState> {
    const [osRes, finRes] = await Promise.all([
      api.get(`/os/${serviceOrderId}`),
      api.get('/financial'),
    ]);
    const os = osRes.data.data || osRes.data;
    const records = finRes.data.data || finRes.data || [];

    const osRecords = Array.isArray(records)
      ? records.filter((r: any) => r.serviceOrderId === serviceOrderId || (r.description && r.description.includes(`#${os?.number}`)))
      : [];

    const totalCalculated = Array.isArray(os?.items)
      ? os.items.reduce((acc: number, item: any) => acc + (Number(item.price || item.unitPrice || 0) * Number(item.quantity || 1)), 0)
      : Number(os?.totalValue || 0);

    return {
      serviceOrderId,
      totalValue: totalCalculated,
      status: osRecords.length > 0 ? (osRecords.every((r: any) => r.paid) ? 'PAID' : 'PENDING') : 'NONE',
      receivables: osRecords.map((r: any) => ({
        id: r.id,
        amount: Number(r.amount || 0),
        dueDate: r.dueDate || r.createdAt,
        status: r.paid ? 'PAID' : 'PENDING',
      })),
    };
  },

  async generateReceivable(serviceOrderId: string, dueDate: string): Promise<any> {
    const osRes = await api.get(`/os/${serviceOrderId}`);
    const os = osRes.data.data || osRes.data;

    const response = await api.post('/financial', {
      description: `Faturamento da OS #${os?.number || serviceOrderId}`,
      amount: Number(os?.totalValue || 100),
      type: 'INCOME',
      category: 'SERVICOS',
      dueDate,
      serviceOrderId,
    });
    return response.data.data || response.data;
  }
};
