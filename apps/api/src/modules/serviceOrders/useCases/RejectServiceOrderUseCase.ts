import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';

export class RejectServiceOrderUseCase {
  async execute(approvalId: string, serviceOrderId: string, companyId: string, rejectedById: string, reason: string) {
    if (!reason || reason.trim().length < 5) {
      throw new AppError('O motivo da rejeição deve ter pelo menos 5 caracteres', 400);
    }

    return await prismaClient.$transaction(async (tx) => {
      // 1. Fetch approval
      const approval = await tx.serviceOrderApproval.findFirst({
        where: { id: approvalId, serviceOrderId, companyId }
      });

      if (!approval) {
        throw new AppError('Solicitação de aprovação não encontrada', 404);
      }

      // 2. Confirm PENDING
      if (approval.status !== 'PENDING') {
        throw new AppError(`Esta aprovação já foi decidida ou invalidada (Status: ${approval.status})`, 400);
      }

      // 3. Confirm latest version
      const latestApproval = await tx.serviceOrderApproval.findFirst({
        where: { serviceOrderId, companyId },
        orderBy: { version: 'desc' }
      });

      if (latestApproval && latestApproval.id !== approval.id) {
        throw new AppError('Esta versão de orçamento está desatualizada', 400);
      }

      // 4. Reject
      const updatedApproval = await tx.serviceOrderApproval.update({
        where: { id: approval.id },
        data: {
          status: 'REJECTED',
          rejectedById,
          rejectedAt: new Date(),
          rejectionReason: reason
        }
      });

      return updatedApproval;
    });
  }
}
