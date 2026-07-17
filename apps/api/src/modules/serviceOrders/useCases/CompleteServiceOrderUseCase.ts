import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';
import { AuditLogService } from '../../../shared/audit/AuditLogService';
import {
  evaluateCompletionBlockers,
  validateCompletionNotes,
} from '../policies/ServiceOrderCompletionPolicy';

interface IRequest {
  serviceOrderId: string;
  companyId: string;
  branchId: string;
  userId: string;
  completionNotes: string;
}

export class CompleteServiceOrderUseCase {
  async execute({ serviceOrderId, companyId, branchId, userId, completionNotes }: IRequest) {
    // 1. Validate completionNotes before entering the transaction
    const notesBlocker = validateCompletionNotes(completionNotes);
    if (notesBlocker) {
      throw new AppError(notesBlocker.message, 400);
    }

    return await prismaClient.$transaction(async (tx) => {
      // 2. Fetch OS — must belong to the same company AND branch
      const os = await tx.serviceOrder.findFirst({
        where: { id: serviceOrderId, companyId, branchId },
        include: {
          parts: { select: { id: true, partId: true, quantity: true, consumedQuantity: true, unitPrice: true } },
          services: { select: { id: true, name: true, price: true, executionStatus: true } },
        },
      });

      if (!os) {
        throw new AppError('Ordem de Serviço não encontrada.', 404);
      }

      // 3. Fetch latest approval version only
      const latestApproval = await tx.serviceOrderApproval.findFirst({
        where: { serviceOrderId, companyId },
        orderBy: { version: 'desc' },
      });

      // 4. Fetch OUT movements for this OS
      const movements = await tx.inventoryMovement.findMany({
        where: { serviceOrderId, type: 'OUT' },
        select: { osPartId: true, quantity: true, type: true },
      });

      // 5. Run all business gates via shared policy
      const blockers = evaluateCompletionBlockers(os, latestApproval, movements);

      if (blockers.length > 0) {
        throw new AppError(
          `Não é possível concluir a OS. Blockers: ${blockers.map((b) => b.message).join(' | ')}`,
          409,
          blockers,
        );
      }

      // 6. Conditional update: only transitions IN_PROGRESS → FINISHED
      // Prevents double-completion in concurrent scenarios
      const result = await tx.serviceOrder.updateMany({
        where: {
          id: serviceOrderId,
          companyId,
          branchId,
          status: 'IN_PROGRESS',
        },
        data: {
          status: 'FINISHED',
          finishedAt: new Date(),
          finishedById: userId,
          completionNotes: completionNotes.trim(),
        },
      });

      if (result.count !== 1) {
        throw new AppError(
          'A ordem de serviço foi alterada ou já foi concluída por outro processo.',
          409,
        );
      }

      // 7. Audit log
      await AuditLogService.log({
        userId,
        companyId,
        action: 'OS_COMPLETED',
        resource: 'SERVICE_ORDER',
        resourceId: serviceOrderId,
        oldValue: { status: 'IN_PROGRESS' },
        newValue: { status: 'FINISHED', finishedAt: new Date().toISOString() },
        tx,
      });

      // 8. Return updated OS
      return tx.serviceOrder.findFirst({
        where: { id: serviceOrderId },
        include: {
          parts: true,
          services: true,
          finishedBy: { select: { id: true, name: true } },
        },
      });
    });
  }
}
