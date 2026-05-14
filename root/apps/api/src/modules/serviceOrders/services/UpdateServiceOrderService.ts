// apps/api/src/modules/serviceOrders/services/UpdateServiceOrderService.ts

import { IServiceOrderRepository, ServiceOrder } from '../repositories/IServiceOrderRepository';
import { UpdateServiceOrderDTO } from '../dtos';
import { AppError } from '../../../shared/errors/AppError';

export class UpdateServiceOrderService {
  constructor(private serviceOrderRepository: IServiceOrderRepository) {}

  async execute(data: UpdateServiceOrderDTO): Promise<ServiceOrder> {
    const { id, companyId } = data;

    const serviceOrderExists = await this.serviceOrderRepository.findById(id, companyId);

    if (!serviceOrderExists) {
      throw new AppError('Service Order not found.', 404);
    }

    const serviceOrder = await this.serviceOrderRepository.update(data);

    return serviceOrder;
  }
}
