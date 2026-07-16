import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';
import { verifyExecutionPreconditions } from '../helpers/verifyExecutionPreconditions';
import { ServiceExecutionStatus } from '@prisma/client';

export class StartServiceExecutionUseCase {
  async execute(serviceOrderId: string, serviceId: string, companyId: string, startedById: string, userRole: string) {
    return await prismaClient.$transaction(async (tx) => {
      // 1. Verify preconditions
      const { svc } = await verifyExecutionPreconditions(tx, serviceOrderId, serviceId, companyId);

      // 2. Validate technician restriction for MECHANIC role
      if (userRole === 'MECHANIC') {
        if (svc.technicianId !== startedById) {
          throw new AppError('Você só pode iniciar serviços atribuídos a você', 403);
        }
        if (svc.executionStatus !== 'ASSIGNED') {
          throw new AppError('O serviço precisa estar no status ASSIGNED para ser iniciado', 409);
        }
      } else {
        // ADMIN/MANAGER can start from PENDING or ASSIGNED
        if (svc.executionStatus !== 'PENDING' && svc.executionStatus !== 'ASSIGNED') {
          throw new AppError('O serviço precisa estar no status PENDING ou ASSIGNED para ser iniciado', 409);
        }
      }

      // 3. Conditional update
      const expectedStatuses: ServiceExecutionStatus[] =
        userRole === 'MECHANIC' ? ['ASSIGNED'] : ['PENDING', 'ASSIGNED'];
      const result = await tx.oSService.updateMany({
        where: {
          id: serviceId,
          serviceOrderId,
          executionStatus: { in: expectedStatuses }
        },
        data: {
          executionStatus: 'IN_PROGRESS',
          startedAt: new Date(),
          startedById,
          // If starting from PENDING by Admin/Manager, set technician as startedById
          ...(svc.executionStatus === 'PENDING' ? { technicianId: startedById, assignedAt: new Date(), assignedById: startedById } : {})
        }
      });

      if (result.count !== 1) {
        throw new AppError('Conflito de transição: o status do serviço foi alterado por outra requisição.', 409);
      }

      return await tx.oSService.findUnique({
        where: { id: serviceId }
      });
    });
  }
}
