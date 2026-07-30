import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';

export class GetServiceOrderExecutionUseCase {
  async execute(serviceOrderId: string, companyId: string) {
    const os = await prismaClient.serviceOrder.findFirst({
      where: { id: serviceOrderId, companyId }
    });

    if (!os) {
      throw new AppError('Ordem de Serviço não encontrada', 404);
    }

    const services = await prismaClient.oSService.findMany({
      where: { serviceOrderId },
      include: {
        technician: { select: { id: true, name: true, email: true } },
        assignedBy: { select: { id: true, name: true } },
        startedBy: { select: { id: true, name: true } },
        pausedBy: { select: { id: true, name: true } },
        resumedBy: { select: { id: true, name: true } },
        completedBy: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    return services;
  }
}
