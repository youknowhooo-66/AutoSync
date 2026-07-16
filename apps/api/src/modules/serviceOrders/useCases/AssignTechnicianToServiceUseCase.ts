import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';
import { verifyExecutionPreconditions } from '../helpers/verifyExecutionPreconditions';

export class AssignTechnicianToServiceUseCase {
  async execute(serviceOrderId: string, serviceId: string, companyId: string, technicianId: string, assignedById: string) {
    return await prismaClient.$transaction(async (tx) => {
      // 1. Verify preconditions
      await verifyExecutionPreconditions(tx, serviceOrderId, serviceId, companyId);

      // 2. Verify technician
      const tech = await tx.user.findFirst({
        where: { id: technicianId, companyId }
      });

      if (!tech) {
        throw new AppError('Técnico não encontrado', 404);
      }

      if (tech.role !== 'MECHANIC') {
        throw new AppError('Apenas usuários com a role MECHANIC podem ser atribuídos como técnicos', 403);
      }

      // 3. Conditional update
      const result = await tx.oSService.updateMany({
        where: {
          id: serviceId,
          serviceOrderId,
          executionStatus: { in: ['PENDING', 'ASSIGNED'] }
        },
        data: {
          executionStatus: 'ASSIGNED',
          technicianId,
          assignedAt: new Date(),
          assignedById
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
