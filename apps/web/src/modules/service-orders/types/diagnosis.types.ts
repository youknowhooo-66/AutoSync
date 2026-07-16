import type { ServiceOrderStatus } from './serviceOrder.types';

export interface DiagnosisResponse {
  serviceOrderId: string;
  description: string;
  status: ServiceOrderStatus;
  updatedAt: string;
}
