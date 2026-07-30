import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';
import { verifyExecutionPreconditions } from '../helpers/verifyExecutionPreconditions';

export class PauseServiceExecutionUseCase {
  async execute(serviceOrderId: string, serviceId: string, companyId: string, pausedById: string, userRole: string, reason: string) {
    if (!reason || reason.trim().length < 5) {
      throw new AppError('O motivo da pausa deve ter pelo menos 5 caracteres', 400);
    }

    return await prismaClient.$transaction(async (tx) => {
      // 1. Verify preconditions
      const { svc } = await verifyExecutionPreconditions(tx, serviceOrderId, serviceId, companyId);

      // 2. Validate technician restriction for MECHANIC role
      if (userRole === 'MECHANIC' && svc.technicianId !== pausedById) {
        throw new AppError('Você só pode pausar serviços atribuídos a você', 403);
      }

      if (svc.executionStatus !== 'IN_PROGRESS') {
        throw new AppError('Apenas serviços em andamento (IN_PROGRESS) podem ser pausados', 409);
      }

      // 3. Conditional update
      const result = await tx.oSService.updateMany({
        where: {
          id: serviceId,
          serviceOrderId,
          executionStatus: 'IN_PROGRESS'
        },
        data: {
          executionStatus: 'PAUSED',
          pausedAt: new Date(),
          pausedById,
          pauseReason: reason
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
