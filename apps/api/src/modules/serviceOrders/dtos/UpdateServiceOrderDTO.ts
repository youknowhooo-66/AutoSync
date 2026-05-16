// apps/api/src/modules/serviceOrders/dtos/UpdateServiceOrderDTO.ts

import { ServiceOrderStatus } from './CreateServiceOrderDTO';

export interface UpdateServiceOrderDTO {
  id: string;
  companyId: string;
  clientId?: string;
  vehicleId?: string;
  description?: string;
  status?: ServiceOrderStatus;
  startDate?: Date;
  endDate?: Date;
  totalValue?: number;
}
