import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';

export class InvalidateApprovalUseCase {
  async execute(approvalId: string, serviceOrderId: string, companyId: string, invalidatedById: string, reason: string) {
    if (!reason || reason.trim().length < 5) {
      throw new AppError('O motivo da invalidação deve ter pelo menos 5 caracteres', 400);
    }

    return await prismaClient.$transaction(async (tx) => {
      // 1. Fetch approval
      const approval = await tx.serviceOrderApproval.findFirst({
        where: { id: approvalId, serviceOrderId, companyId }
      });

      if (!approval) {
        throw new AppError('Solicitação de aprovação não encontrada', 404);
      }

      // 2. Confirm status is PENDING or APPROVED
      if (approval.status !== 'PENDING' && approval.status !== 'APPROVED') {
        throw new AppError(`Apenas solicitações PENDING ou APPROVED podem ser invalidadas. Status atual: ${approval.status}`, 400);
      }

      // 3. Confirm latest version
      const latestApproval = await tx.serviceOrderApproval.findFirst({
        where: { serviceOrderId, companyId },
        orderBy: { version: 'desc' }
      });

      if (latestApproval && latestApproval.id !== approval.id) {
        throw new AppError('Esta versão de orçamento está desatualizada', 400);
      }

      // 4. Invalidate
      const updatedApproval = await tx.serviceOrderApproval.update({
        where: { id: approval.id },
        data: {
          status: 'INVALIDATED',
          invalidatedById,
          invalidatedAt: new Date(),
          invalidationReason: reason
        }
      });

      return updatedApproval;
    });
  }
}
