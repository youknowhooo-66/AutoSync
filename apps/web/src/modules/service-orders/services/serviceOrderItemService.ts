import api from '@/services/api';
import type { AddServiceOrderItemPayload, RemoveServiceOrderItemPayload } from '../types/serviceOrderItem.types';

export const serviceOrderItemService = {
  async addItems(payload: AddServiceOrderItemPayload) {
    const { serviceOrderId, parts, services } = payload;
    const response = await api.post(`/os/${serviceOrderId}/items`, { parts, services });
    return response.data;
  },
  
  async removeItem(payload: RemoveServiceOrderItemPayload) {
    const { serviceOrderId, itemId, type } = payload;
    const response = await api.delete(`/os/${serviceOrderId}/items/${itemId}?type=${type}`);
    return response.data;
  }
};
