import { prismaClient } from '../../../shared/database/prismaClient';

export class ListServiceOrdersUseCase {
  async execute(companyId: string) {
    const serviceOrders = await prismaClient.serviceOrder.findMany({
      where: { companyId,  },
      include: {
        client: true,
        vehicle: true,
        branch: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return serviceOrders;
  }
}
