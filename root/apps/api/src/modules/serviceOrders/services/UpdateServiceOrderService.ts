// apps/api/src/modules/serviceOrders/services/UpdateServiceOrderService.ts

import { IServiceOrderRepository, ServiceOrder } from '../repositories/IServiceOrderRepository';
import { UpdateServiceOrderDTO } from '../dtos';
import { AppError } from '../../../shared/errors/AppError';

export class UpdateServiceOrderService {
  constructor(private serviceOrderRepository: IServiceOrderRepository) {}

  async execute({ id, companyId, clientId, vehicleId, description, status, startDate, endDate, totalValue }: UpdateServiceOrderDTO): Promise<ServiceOrder> {
    if (!id || !companyId) {
      throw new AppError('Service Order ID and Company ID are required.');
    }

    const serviceOrder = await this.serviceOrderRepository.findById(id, companyId);

    if (!serviceOrder) {
      throw new AppError('Service Order not found.', 404);
    }

    // You might want to add validation to ensure clientId and vehicleId exist
    // in their respective modules and belong to the same companyId, if they are being updated.

    const updatedServiceOrder = await this.serviceOrderRepository.update({
      id,
      companyId,
      clientId: clientId || serviceOrder.clientId,
      vehicleId: vehicleId || serviceOrder.vehicleId,
      description: description || serviceOrder.description,
      status: status || serviceOrder.status,
      startDate: startDate || serviceOrder.startDate,
      endDate: endDate || serviceOrder.endDate,
      totalValue: totalValue || serviceOrder.totalValue,
    });

    return updatedServiceOrder;
  }
}
