// apps/api/src/modules/serviceOrders/repositories/IServiceOrderRepository.ts

import { CreateServiceOrderDTO, UpdateServiceOrderDTO, ServiceOrderStatus } from '../dtos';

export interface ServiceOrder {
  id: string;
  companyId: string;
  clientId: string;
  vehicleId: string;
  description: string;
  status: ServiceOrderStatus;
  startDate: Date;
  endDate?: Date;
  totalValue?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IServiceOrderRepository {
  create(data: CreateServiceOrderDTO): Promise<ServiceOrder>;
  findById(id: string, companyId: string): Promise<ServiceOrder | null>;
  findManyByCompany(companyId: string): Promise<ServiceOrder[]>;
  update(data: UpdateServiceOrderDTO): Promise<ServiceOrder>;
  delete(id: string, companyId: string): Promise<void>;
}
