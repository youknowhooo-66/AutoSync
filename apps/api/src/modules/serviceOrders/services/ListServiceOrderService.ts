// apps/api/src/modules/serviceOrders/services/ListServiceOrderService.ts

import { IServiceOrderRepository, ServiceOrder } from '../repositories/IServiceOrderRepository';
import { AppError } from '../../../shared/errors/AppError';

export class ListServiceOrderService {
  constructor(private serviceOrderRepository: IServiceOrderRepository) {}

  async execute(companyId: string): Promise<ServiceOrder[]> {
    if (!companyId) {
      throw new AppError('Company ID is required.');
    }

    const serviceOrders = await this.serviceOrderRepository.findManyByCompany(companyId);

    return serviceOrders;
  }
}
