// apps/api/src/modules/serviceOrders/dtos/CreateServiceOrderDTO.ts

export enum ServiceOrderStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'FINISHED',
  CANCELLED = 'CANCELLED',
}

export interface CreateServiceOrderDTO {
  companyId: string;
  clientId: string;
  vehicleId: string;
  description: string;
  status: ServiceOrderStatus;
  startDate: Date;
  endDate?: Date;
  totalValue?: number;
}
