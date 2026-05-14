// apps/api/src/modules/serviceOrders/services/DeleteServiceOrderService.ts

import { IServiceOrderRepository } from '../repositories/IServiceOrderRepository';
import { AppError } from '../../../shared/errors/AppError';

export class DeleteServiceOrderService {
  constructor(private serviceOrderRepository: IServiceOrderRepository) {}

  async execute(id: string, companyId: string): Promise<void> {
    if (!id || !companyId) {
      throw new AppError('Service Order ID and Company ID are required.');
    }

    const serviceOrder = await this.serviceOrderRepository.findById(id, companyId);

    if (!serviceOrder) {
      throw new AppError('Service Order not found.', 404);
    }

    await this.serviceOrderRepository.delete(id, companyId);
  }
}
