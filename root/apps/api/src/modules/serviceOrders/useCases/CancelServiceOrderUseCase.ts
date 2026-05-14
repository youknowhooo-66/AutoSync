import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';
import { ServiceOrderStatus } from '../enums/ServiceOrderStatus';

interface IRequest {
  serviceOrderId: string;
  companyId: string;
}

export class CancelServiceOrderUseCase {
  async execute({ serviceOrderId, companyId }: IRequest) {
    const serviceOrder = await prismaClient.serviceOrder.findFirst({
      where: { id: serviceOrderId, companyId, deletedAt: null },
    });

    if (!serviceOrder) {
      throw new AppError('Service Order not found.', 404);
    }

    if (serviceOrder.status === ServiceOrderStatus.COMPLETED) {
      throw new AppError('Cannot cancel a completed service order.', 400);
    }

    if (serviceOrder.status === ServiceOrderStatus.CANCELED) {
      throw new AppError('Service order is already canceled.', 400);
    }

    return await prismaClient.serviceOrder.update({
      where: { id: serviceOrderId },
      data: {
        status: ServiceOrderStatus.CANCELED,
      },
    });
  }
}
