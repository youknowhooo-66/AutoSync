import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';
import { verifyExecutionPreconditions } from '../helpers/verifyExecutionPreconditions';

export class CompleteServiceExecutionUseCase {
  async execute(serviceOrderId: string, serviceId: string, companyId: string, completedById: string, userRole: string, notes?: string) {
    return await prismaClient.$transaction(async (tx) => {
      // 1. Verify preconditions
      const { svc } = await verifyExecutionPreconditions(tx, serviceOrderId, serviceId, companyId);

      // 2. Validate technician restriction for MECHANIC role
      if (userRole === 'MECHANIC' && svc.technicianId !== completedById) {
        throw new AppError('Você só pode concluir serviços atribuídos a você', 403);
      }

      if (svc.executionStatus !== 'IN_PROGRESS') {
        throw new AppError('Apenas serviços em andamento (IN_PROGRESS) podem ser concluídos', 409);
      }

      // 3. Conditional update
      const result = await tx.oSService.updateMany({
        where: {
          id: serviceId,
          serviceOrderId,
          executionStatus: 'IN_PROGRESS'
        },
        data: {
          executionStatus: 'COMPLETED',
          completedAt: new Date(),
          completedById,
          completionNotes: notes
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
