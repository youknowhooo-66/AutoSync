import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';

export class ApproveServiceOrderUseCase {
  async execute(approvalId: string, serviceOrderId: string, companyId: string, approvedById: string) {
    return await prismaClient.$transaction(async (tx) => {
      // 1. Fetch approval
      const approval = await tx.serviceOrderApproval.findFirst({
        where: { id: approvalId, serviceOrderId, companyId }
      });

      if (!approval) {
        throw new AppError('Solicitação de aprovação não encontrada', 404);
      }

      // 2. Confirm it is PENDING
      if (approval.status !== 'PENDING') {
        throw new AppError(`Esta aprovação já foi decidida ou invalidada (Status: ${approval.status})`, 400);
      }

      // 3. Confirm that it is the latest version
      const latestApproval = await tx.serviceOrderApproval.findFirst({
        where: { serviceOrderId, companyId },
        orderBy: { version: 'desc' }
      });

      if (latestApproval && latestApproval.id !== approval.id) {
        throw new AppError('Esta versão de orçamento está desatualizada', 400);
      }

      // 4. Approve
      const updatedApproval = await tx.serviceOrderApproval.update({
        where: { id: approval.id },
        data: {
          status: 'APPROVED',
          approvedById,
          approvedAt: new Date(),
          approvalMethod: 'ASSISTED'
        }
      });

      return updatedApproval;
    });
  }
}
