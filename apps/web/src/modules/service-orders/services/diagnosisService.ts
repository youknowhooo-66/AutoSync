import api from '@/services/api';
import type { DiagnosisResponse } from '../types/diagnosis.types';

export const diagnosisService = {
  async registerDiagnosis(serviceOrderId: string, description: string): Promise<DiagnosisResponse> {
    const response = await api.put(`/service-orders/${serviceOrderId}/diagnosis`, { description });
    return response.data.data;
  },
};
