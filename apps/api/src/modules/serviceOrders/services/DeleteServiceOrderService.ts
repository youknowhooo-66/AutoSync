// apps/api/src/modules/serviceOrders/services/DeleteServiceOrderService.ts

import { IServiceOrderRepository } from '../repositories/IServiceOrderRepository';
import { AppError } from '../../../shared/errors/AppError';

export class DeleteServiceOrderService {
  constructor(private serviceOrderRepository: IServiceOrderRepository) {}

  async execute(id: string, companyId: string): Promise<void> {
    const serviceOrderExists = await this.serviceOrderRepository.findById(id, companyId);

    if (!serviceOrderExists) {
      throw new AppError('Service Order not found.', 404);
    }

    await this.serviceOrderRepository.delete(id, companyId);
  }
}
