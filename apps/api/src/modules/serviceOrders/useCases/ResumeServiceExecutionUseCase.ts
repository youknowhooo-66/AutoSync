import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';
import { verifyExecutionPreconditions } from '../helpers/verifyExecutionPreconditions';

export class ResumeServiceExecutionUseCase {
  async execute(serviceOrderId: string, serviceId: string, companyId: string, resumedById: string, userRole: string) {
    return await prismaClient.$transaction(async (tx) => {
      // 1. Verify preconditions
      const { svc } = await verifyExecutionPreconditions(tx, serviceOrderId, serviceId, companyId);

      // 2. Validate technician restriction for MECHANIC role
      if (userRole === 'MECHANIC' && svc.technicianId !== resumedById) {
        throw new AppError('Você só pode retomar serviços atribuídos a você', 403);
      }

      if (svc.executionStatus !== 'PAUSED') {
        throw new AppError('Apenas serviços pausados (PAUSED) podem ser retomados', 409);
      }

      // 3. Conditional update
      const result = await tx.oSService.updateMany({
        where: {
          id: serviceId,
          serviceOrderId,
          executionStatus: 'PAUSED'
        },
        data: {
          executionStatus: 'IN_PROGRESS',
          resumedAt: new Date(),
          resumedById
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
