import api from '@/services/api';
import type {
  ServiceOrderApproval,
  ApproveServiceOrderPayload,
  RejectServiceOrderPayload,
  InvalidateApprovalPayload
} from '../types/approval.types';

export const approvalService = {
  async getByServiceOrder(serviceOrderId: string): Promise<ServiceOrderApproval | null> {
    const response = await api.get(`/api/service-orders/${serviceOrderId}/approval`);
    return response.data.data;
  },

  async requestApproval(serviceOrderId: string): Promise<ServiceOrderApproval> {
    const response = await api.post(`/api/service-orders/${serviceOrderId}/approval/request`);
    return response.data.data;
  },

  async approve(payload: ApproveServiceOrderPayload): Promise<ServiceOrderApproval> {
    const response = await api.post(`/api/service-orders/${payload.serviceOrderId}/approval/approve`, {
      approvalId: payload.approvalId
    });
    return response.data.data;
  },

  async reject(payload: RejectServiceOrderPayload): Promise<ServiceOrderApproval> {
    const response = await api.post(`/api/service-orders/${payload.serviceOrderId}/approval/reject`, {
      approvalId: payload.approvalId,
      reason: payload.reason
    });
    return response.data.data;
  },

  async invalidate(payload: InvalidateApprovalPayload): Promise<ServiceOrderApproval> {
    const response = await api.post(`/api/service-orders/${payload.serviceOrderId}/approval/invalidate`, {
      approvalId: payload.approvalId,
      reason: payload.reason
    });
    return response.data.data;
  }
};
