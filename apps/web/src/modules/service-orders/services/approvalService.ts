import api from '@/services/api';
import type {
  ServiceOrderApproval,
  ApproveServiceOrderPayload,
  RejectServiceOrderPayload,
  InvalidateApprovalPayload
} from '../types/approval.types';

export const approvalService = {
  async getByServiceOrder(serviceOrderId: string): Promise<ServiceOrderApproval | null> {
    const response = await api.get(`/os/${serviceOrderId}`);
    const os = response.data.data || response.data;
    if (!os) return null;
    return {
      id: `appr-${os.id}`,
      serviceOrderId: os.id,
      status: os.status === 'APPROVED' ? 'APPROVED' : os.status === 'REJECTED' ? 'REJECTED' : 'PENDING',
      createdAt: os.createdAt || new Date().toISOString(),
      updatedAt: os.updatedAt || new Date().toISOString(),
    };
  },

  async requestApproval(serviceOrderId: string): Promise<ServiceOrderApproval> {
    const response = await api.put(`/os/${serviceOrderId}/status`, { status: 'WAITING_APPROVAL' });
    const os = response.data.data || response.data;
    return {
      id: `appr-${os.id || serviceOrderId}`,
      serviceOrderId: serviceOrderId,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async approve(payload: ApproveServiceOrderPayload): Promise<ServiceOrderApproval> {
    const response = await api.put(`/os/${payload.serviceOrderId}/status`, { status: 'APPROVED' });
    const os = response.data.data || response.data;
    return {
      id: payload.approvalId || `appr-${payload.serviceOrderId}`,
      serviceOrderId: payload.serviceOrderId,
      status: 'APPROVED',
      approvedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async reject(payload: RejectServiceOrderPayload): Promise<ServiceOrderApproval> {
    const response = await api.put(`/os/${payload.serviceOrderId}/status`, { status: 'REJECTED', notes: payload.reason });
    const os = response.data.data || response.data;
    return {
      id: payload.approvalId || `appr-${payload.serviceOrderId}`,
      serviceOrderId: payload.serviceOrderId,
      status: 'REJECTED',
      rejectionReason: payload.reason,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async invalidate(payload: InvalidateApprovalPayload): Promise<ServiceOrderApproval> {
    const response = await api.put(`/os/${payload.serviceOrderId}/status`, { status: 'DRAFT', notes: payload.reason });
    const os = response.data.data || response.data;
    return {
      id: payload.approvalId || `appr-${payload.serviceOrderId}`,
      serviceOrderId: payload.serviceOrderId,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
};
