import api from '@/services/api';
import type {
  ServiceOrderApproval,
  ApproveServiceOrderPayload,
  RejectServiceOrderPayload,
  InvalidateApprovalPayload
} from '../types/approval.types';

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapApproval(data: any): ServiceOrderApproval | null {
  if (!data) return null;
  return {
    id: data.id,
    serviceOrderId: data.serviceOrderId,
    companyId: data.companyId,
    branchId: data.branchId,
    version: typeof data.version === 'number' ? data.version : toNumber(data.version),
    status: data.status,
    snapshotVersion: data.snapshotVersion,
    snapshot: data.snapshot,
    totalParts: String(data.totalParts ?? '0'),
    totalServices: String(data.totalServices ?? '0'),
    discount: String(data.discount ?? '0'),
    finalValue: String(data.finalValue ?? '0'),
    approvalMethod: data.approvalMethod,
    requestedAt: data.requestedAt,
    requestedById: data.requestedById,
    approvedAt: data.approvedAt,
    approvedById: data.approvedById,
    rejectedAt: data.rejectedAt,
    rejectedById: data.rejectedById,
    rejectionReason: data.rejectionReason,
    invalidatedAt: data.invalidatedAt,
    invalidatedById: data.invalidatedById,
    invalidationReason: data.invalidationReason,
    customerName: data.customerName,
    customerDocument: data.customerDocument,
    notes: data.notes,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export const approvalService = {
  async getByServiceOrder(serviceOrderId: string): Promise<ServiceOrderApproval | null> {
    const response = await api.get(`/os/${serviceOrderId}/approval`);
    const data = response.data?.data;
    return mapApproval(data);
  },

  async requestApproval(serviceOrderId: string): Promise<ServiceOrderApproval> {
    const response = await api.post(`/os/${serviceOrderId}/approval/request`);
    const data = response.data?.data || response.data;
    return mapApproval(data)!;
  },

  async approve(payload: ApproveServiceOrderPayload): Promise<ServiceOrderApproval> {
    const response = await api.post(`/os/${payload.serviceOrderId}/approval/approve`, {
      approvalId: payload.approvalId
    });
    const data = response.data?.data || response.data;
    return mapApproval(data)!;
  },

  async reject(payload: RejectServiceOrderPayload): Promise<ServiceOrderApproval> {
    const response = await api.post(`/os/${payload.serviceOrderId}/approval/reject`, {
      approvalId: payload.approvalId,
      reason: payload.reason
    });
    const data = response.data?.data || response.data;
    return mapApproval(data)!;
  },

  async invalidate(payload: InvalidateApprovalPayload): Promise<ServiceOrderApproval> {
    const response = await api.post(`/os/${payload.serviceOrderId}/approval/invalidate`, {
      approvalId: payload.approvalId,
      reason: payload.reason
    });
    const data = response.data?.data || response.data;
    return mapApproval(data)!;
  }
};
export default approvalService;
