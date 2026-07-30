import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';

interface IRequest {
  serviceOrderId: string;
  companyId: string;
  userBranchId?: string | null;
}

export class GetServiceOrderFinanceStateUseCase {
  async execute({ serviceOrderId, companyId, userBranchId }: IRequest) {
    // 1. Fetch OS with tenant isolation
    const os = await prismaClient.serviceOrder.findFirst({
      where: { id: serviceOrderId, companyId },
    });

    if (!os) {
      throw new AppError('Ordem de Serviço não encontrada.', 404);
    }

    // 2. Validate branch isolation if user has a specific branch assigned
    if (userBranchId && os.branchId !== userBranchId) {
      throw new AppError('Ordem de Serviço não encontrada.', 404);
    }

    // 3. If OS is not finished, return NOT_ELIGIBLE immediately
    if (os.status !== 'FINISHED') {
      return {
        status: 'NOT_ELIGIBLE' as const,
        reason: 'SERVICE_ORDER_NOT_FINISHED' as const,
      };
    }

    // 4. Fetch the latest approval version
    const latestApproval = await prismaClient.serviceOrderApproval.findFirst({
      where: { serviceOrderId, companyId },
      orderBy: { version: 'desc' },
    });

    if (!latestApproval) {
      return {
        status: 'NOT_ELIGIBLE' as const,
        reason: 'APPROVAL_NOT_FOUND' as const,
      };
    }

    if (latestApproval.status !== 'APPROVED') {
      return {
        status: 'NOT_ELIGIBLE' as const,
        reason: 'LATEST_APPROVAL_NOT_APPROVED' as const,
      };
    }

    const finalValue = latestApproval.finalValue;

    // 5. If final value is <= 0, it's NOT_REQUIRED
    if (Number(finalValue) <= 0) {
      return {
        status: 'NOT_REQUIRED' as const,
        reason: 'ZERO_VALUE' as const,
        totalParts: latestApproval.totalParts.toString(),
        totalServices: latestApproval.totalServices.toString(),
        discount: latestApproval.discount.toString(),
        finalValue: finalValue.toString(),
      };
    }

    // 6. Check if receivable exists for this OS and approval version
    const receivable = await prismaClient.financialRecord.findUnique({
      where: {
        serviceOrderId_serviceOrderApprovalId: {
          serviceOrderId,
          serviceOrderApprovalId: latestApproval.id,
        },
      },
    });

    if (receivable) {
      return {
        status: 'GENERATED' as const,
        totalParts: latestApproval.totalParts.toString(),
        totalServices: latestApproval.totalServices.toString(),
        discount: latestApproval.discount.toString(),
        finalValue: finalValue.toString(),
        receivable: {
          id: receivable.id,
          amount: receivable.amount.toString(),
          status: receivable.status,
          dueDate: receivable.dueDate ? receivable.dueDate.toISOString() : '',
          createdAt: receivable.createdAt.toISOString(),
        },
      };
    }

    // 7. Otherwise, it is NOT_GENERATED
    return {
      status: 'NOT_GENERATED' as const,
      totalParts: latestApproval.totalParts.toString(),
      totalServices: latestApproval.totalServices.toString(),
      discount: latestApproval.discount.toString(),
      finalValue: finalValue.toString(),
    };
  }
}
