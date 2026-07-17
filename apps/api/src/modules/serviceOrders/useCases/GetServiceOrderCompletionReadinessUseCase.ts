import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';
import { evaluateCompletionBlockers } from '../policies/ServiceOrderCompletionPolicy';

export class GetServiceOrderCompletionReadinessUseCase {
  async execute(serviceOrderId: string, companyId: string) {
    // 1. Fetch OS with tenant isolation
    const os = await prismaClient.serviceOrder.findFirst({
      where: { id: serviceOrderId, companyId },
      include: {
        parts: { select: { id: true, partId: true, quantity: true, consumedQuantity: true, unitPrice: true } },
        services: { select: { id: true, name: true, price: true, executionStatus: true } },
      },
    });

    if (!os) {
      throw new AppError('Ordem de Serviço não encontrada.', 404);
    }

    // 2. Fetch latest approval version only
    const latestApproval = await prismaClient.serviceOrderApproval.findFirst({
      where: { serviceOrderId, companyId },
      orderBy: { version: 'desc' },
    });

    // 3. Fetch OUT movements tied to this OS
    const movements = await prismaClient.inventoryMovement.findMany({
      where: { serviceOrderId, type: 'OUT' },
      select: { osPartId: true, quantity: true, type: true },
    });

    // 4. Run policy (pure function — no side effects)
    const blockers = evaluateCompletionBlockers(os, latestApproval, movements);

    const isCompleted = os.status === 'FINISHED';

    return {
      ready: blockers.length === 0,
      completed: isCompleted,
      blockers,
    };
  }
}
