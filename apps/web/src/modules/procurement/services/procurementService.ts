import api from '@/services/api';
import {
  PurchaseRequest,
  CreatePartRequestInput,
  RegisterPurchaseInput,
  ReceivePartInput,
  InstallPartInput,
  CancelPartRequestInput,
  PurchaseRequestFilters,
  NotificationListResponse,
} from '../types/procurement.types';

export const procurementService = {
  async createPartRequest(input: CreatePartRequestInput): Promise<PurchaseRequest> {
    const res = await api.post('/procurement/part-requests', input);
    return res.data.data;
  },

  async listPartRequests(filters?: PurchaseRequestFilters): Promise<PurchaseRequest[]> {
    const res = await api.get('/procurement/part-requests', { params: filters });
    return res.data.data;
  },

  async getPartRequest(id: string): Promise<PurchaseRequest> {
    const res = await api.get(`/procurement/part-requests/${id}`);
    return res.data.data;
  },

  async getCodeSuggestion(id: string): Promise<{ suggestedCode: string }> {
    const res = await api.get(`/procurement/part-requests/${id}/code-suggestion`);
    return res.data.data;
  },

  async startProgress(id: string): Promise<PurchaseRequest> {
    const res = await api.post(`/procurement/part-requests/${id}/start`);
    return res.data.data;
  },

  async registerPurchase(id: string, input: RegisterPurchaseInput): Promise<PurchaseRequest> {
    const res = await api.post(`/procurement/part-requests/${id}/purchase`, input);
    return res.data.data;
  },

  async receivePart(id: string, input: ReceivePartInput): Promise<PurchaseRequest> {
    const res = await api.post(`/procurement/part-requests/${id}/receive`, input);
    return res.data.data;
  },

  async installPart(id: string, input?: InstallPartInput): Promise<PurchaseRequest> {
    const res = await api.post(`/procurement/part-requests/${id}/install`, input || {});
    return res.data.data;
  },

  async cancelPartRequest(id: string, input: CancelPartRequestInput): Promise<PurchaseRequest> {
    const res = await api.post(`/procurement/part-requests/${id}/cancel`, input);
    return res.data.data;
  },

  async listNotifications(unreadOnly = false): Promise<NotificationListResponse> {
    const res = await api.get('/notifications', { params: { unreadOnly } });
    return res.data.data;
  },

  async markNotificationRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  },

  async markAllNotificationsRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },
};
