// apps/api/src/modules/serviceOrders/repositories/IServiceOrderRepository.ts

import { CreateServiceOrderDTO, UpdateServiceOrderDTO, ServiceOrderStatus } from '../dtos';
import { ServiceOrder } from "@prisma/client";

export interface IServiceOrderRepository {
  create(data: CreateServiceOrderDTO): Promise<ServiceOrder>;
  findById(id: string, companyId: string): Promise<ServiceOrder | null>;
  findManyByCompany(companyId: string): Promise<ServiceOrder[]>;
  findManyByClient(clientId: string, companyId: string): Promise<ServiceOrder[]>;
  findManyByVehicle(vehicleId: string, companyId: string): Promise<ServiceOrder[]>;
  update(data: UpdateServiceOrderDTO): Promise<ServiceOrder>;
  delete(id: string, companyId: string): Promise<void>;
}

export type { ServiceOrder };
