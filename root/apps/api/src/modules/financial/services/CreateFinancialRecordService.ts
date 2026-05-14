import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';
import { AuditLogService } from '../../../shared/audit/AuditLogService';

interface IFinancialRequest {
  companyId: string;
  userId: string;
  branchId: string;
  type: 'PAYABLE' | 'RECEIVABLE';
  category: string;
  description?: string;
  amount: number;
  dueDate: Date;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
}

export class CreateFinancialRecordService {
  async execute(data: IFinancialRequest) {
    return await prismaClient.$transaction(async (tx) => {
      const record = await tx.financialRecord.create({
        data: {
          companyId: data.companyId,
          branchId: data.branchId,
          type: data.type,
          category: data.category,
          description: data.description,
          amount: data.amount,
          dueDate: data.dueDate,
          status: data.status,
          paymentDate: data.status === 'PAID' ? new Date() : null,
        },
      });

      await AuditLogService.log({
        userId: data.userId,
        companyId: data.companyId,
        action: 'FINANCIAL_RECORD_CREATE',
        resource: 'FINANCIAL',
        resourceId: record.id,
        newValue: record,
      });

      return record;
    });
  }
}
