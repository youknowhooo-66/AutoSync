import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';

export class ShowServiceOrderUseCase {
  async execute(id: string, companyId: string) {
    const serviceOrder = await prismaClient.serviceOrder.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
      include: {
        client: true,
        vehicle: true,
        branch: true,
        mechanic: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        parts: {
          include: {
            part: true,
          },
        },
        services: true,
      },
    });

    if (!serviceOrder) {
      throw new AppError('Ordem de Serviço não encontrada', 404);
    }

    return serviceOrder;
  }
}
