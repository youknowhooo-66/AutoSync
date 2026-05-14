// apps/api/src/modules/serviceOrders/services/CreateServiceOrderService.ts

import { IServiceOrderRepository, ServiceOrder } from '../repositories/IServiceOrderRepository';
import { CreateServiceOrderDTO } from '../dtos';
import { AppError } from '../../../shared/errors/AppError';

export class CreateServiceOrderService {
  constructor(private serviceOrderRepository: IServiceOrderRepository) {}

  async execute({ companyId, clientId, vehicleId, description, status, startDate, endDate, totalValue }: CreateServiceOrderDTO): Promise<ServiceOrder> {
    if (!companyId) {
      throw new AppError('Company ID is required.');
    }
    if (!clientId) {
      throw new AppError('Client ID is required.');
    }
    if (!vehicleId) {
      throw new AppError('Vehicle ID is required.');
    }
    if (!description) {
      throw new AppError('Description is required.');
    }
    if (!status) {
      throw new AppError('Status is required.');
    }
    if (!startDate) {
      throw new AppError('Start date is required.');
    }

    // You might want to add validation to ensure clientId and vehicleId exist
    // in their respective modules and belong to the same companyId.

    const serviceOrder = await this.serviceOrderRepository.create({
      companyId,
      clientId,
      vehicleId,
      description,
      status,
      startDate,
      endDate,
      totalValue,
    });

    return serviceOrder;
  }
}
