import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';
import { ServiceOrderStatus } from '../enums/ServiceOrderStatus';

interface IRequest {
  serviceOrderId: string;
  companyId: string;
}

export class StartServiceOrderUseCase {
  async execute({ serviceOrderId, companyId }: IRequest) {
    const serviceOrder = await prismaClient.serviceOrder.findFirst({
      where: { id: serviceOrderId, companyId, deletedAt: null },
    });

    if (!serviceOrder) {
      throw new AppError('Service Order not found.', 404);
    }

    if (serviceOrder.status !== 'OPEN') {
      throw new AppError('Only created service orders can be started.', 400);
    }

    return await prismaClient.serviceOrder.update({
      where: { id: serviceOrderId },
      data: {
        status: ServiceOrderStatus.IN_PROGRESS,
      },
    });
  }
}
