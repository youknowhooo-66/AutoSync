import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';
import { AuditLogService } from '../../../shared/audit/AuditLogService';
import { Prisma } from '@prisma/client';

interface IRequest {
  serviceOrderId: string;
  companyId: string;
  userBranchId?: string | null;
  userId: string;
  dueDateStr: string;
}

function parseCivilDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    throw new AppError('Data de vencimento inválida', 400);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day, 12));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new AppError('Data de vencimento inválida', 400);
  }

  return date;
}

export class GenerateServiceOrderReceivableUseCase {
  async execute({ serviceOrderId, companyId, userBranchId, userId, dueDateStr }: IRequest) {
    // 1. Parse and validate due date
    const normalizedDueDate = parseCivilDate(dueDateStr);

    // 2. Fetch OS & latest approval to perform initial checks (fast path)
    const os = await prismaClient.serviceOrder.findFirst({
      where: { id: serviceOrderId, companyId },
    });

    if (!os) {
      throw new AppError('Ordem de Serviço não encontrada.', 404);
    }

    if (userBranchId && os.branchId !== userBranchId) {
      throw new AppError('Ordem de Serviço não encontrada.', 404);
    }

    if (os.status !== 'FINISHED' || !os.finishedAt) {
      throw new AppError('A Ordem de Serviço deve estar concluída (FINISHED) para gerar recebível.', 400);
    }

    const latestApproval = await prismaClient.serviceOrderApproval.findFirst({
      where: { serviceOrderId, companyId },
      orderBy: { version: 'desc' },
    });

    if (!latestApproval) {
      throw new AppError('Nenhum orçamento encontrado para esta Ordem de Serviço.', 400);
    }

    if (latestApproval.status !== 'APPROVED') {
      throw new AppError('O último orçamento deve estar aprovado (APPROVED) para gerar recebível.', 400);
    }

    if (Number(latestApproval.finalValue) <= 0) {
      throw new AppError(
        'A ordem de serviço não possui valor a receber.',
        409,
        [{ code: 'FINANCIAL_OBLIGATION_NOT_REQUIRED', message: 'A ordem de serviço não possui valor a receber.' }]
      );
    }

    // Compare dueDate with finishedAt civil date
    const finishedDate = new Date(Date.UTC(
      os.finishedAt.getUTCFullYear(),
      os.finishedAt.getUTCMonth(),
      os.finishedAt.getUTCDate(),
      12
    ));

    if (normalizedDueDate.getTime() < finishedDate.getTime()) {
      throw new AppError('A data de vencimento não pode ser anterior à data de conclusão da OS.', 400);
    }

    // 3. Fast-path check for pre-existing receivable
    const existing = await prismaClient.financialRecord.findUnique({
      where: {
        serviceOrderId_serviceOrderApprovalId: {
          serviceOrderId,
          serviceOrderApprovalId: latestApproval.id,
        },
      },
    });

    if (existing) {
      return {
        created: false,
        receivable: existing,
      };
    }

    // 4. Try transaction & handle P2002 outside
    try {
      const receivable = await prismaClient.$transaction(async (tx) => {
        // Re-read OS with lock/isolation
        const txOs = await tx.serviceOrder.findFirst({
          where: { id: serviceOrderId, companyId },
        });

        if (!txOs || txOs.status !== 'FINISHED' || !txOs.finishedAt) {
          throw new AppError('A Ordem de Serviço deve estar concluída (FINISHED) para gerar recebível.', 400);
        }

        const txApproval = await tx.serviceOrderApproval.findFirst({
          where: { serviceOrderId, companyId },
          orderBy: { version: 'desc' },
        });

        if (!txApproval || txApproval.status !== 'APPROVED') {
          throw new AppError('O último orçamento deve estar aprovado (APPROVED) para gerar recebível.', 400);
        }

        if (Number(txApproval.finalValue) <= 0) {
          throw new AppError(
            'A ordem de serviço não possui valor a receber.',
            409,
            [{ code: 'FINANCIAL_OBLIGATION_NOT_REQUIRED', message: 'A ordem de serviço não possui valor a receber.' }]
          );
        }

        // Check again inside tx
        const txExisting = await tx.financialRecord.findUnique({
          where: {
            serviceOrderId_serviceOrderApprovalId: {
              serviceOrderId,
              serviceOrderApprovalId: txApproval.id,
            },
          },
        });

        if (txExisting) {
          throw new AppError('Recebível já gerado para esta Ordem de Serviço e aprovação.', 409);
        }

        // Create FinancialRecord
        const record = await tx.financialRecord.create({
          data: {
            companyId,
            branchId: txOs.branchId,
            type: 'RECEIVABLE',
            category: 'Ordem de Serviço',
            description: `Recebível ref. OS #${txOs.number} (Orçamento v${txApproval.version})`,
            amount: txApproval.finalValue,
            dueDate: normalizedDueDate,
            status: 'PENDING',
            serviceOrderId,
            serviceOrderApprovalId: txApproval.id,
          },
        });

        // Create AuditLog
        await AuditLogService.log({
          userId,
          companyId,
          action: 'CREATE_FROM_SERVICE_ORDER',
          resource: 'FINANCIAL_RECORD',
          resourceId: record.id,
          newValue: {
            serviceOrderId,
            serviceOrderApprovalId: txApproval.id,
            approvalVersion: txApproval.version,
            amount: txApproval.finalValue.toString(),
            dueDate: normalizedDueDate.toISOString(),
            financialRecordId: record.id,
          },
          tx,
        });

        return record;
      });

      return {
        created: true,
        receivable,
      };
    } catch (error: any) {
      // Catch P2002 Unique Constraint error outside the transaction
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const fallbackExisting = await prismaClient.financialRecord.findUnique({
          where: {
            serviceOrderId_serviceOrderApprovalId: {
              serviceOrderId,
              serviceOrderApprovalId: latestApproval.id,
            },
          },
        });

        if (fallbackExisting) {
          return {
            created: false,
            receivable: fallbackExisting,
          };
        }
      }

      throw error;
    }
  }
}
