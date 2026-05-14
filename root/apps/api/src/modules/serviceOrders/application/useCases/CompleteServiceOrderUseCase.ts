import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';
import { ServiceOrderStatus } from '../../enums/ServiceOrderStatus';
import { EventDispatcher } from '../../../shared/events/EventDispatcher';
import { logger } from '../../../shared/logger';
import { PolicyEngine } from '../../../modules/auth/policy/PolicyEngine';
import { Permission } from '../../../modules/auth/rbac/permissions';

interface IRequest {
  serviceOrderId: string;
  companyId: string;
  operationalBranchId: string; // The branch where the OS belongs
  userId: string;
  userRole: any; 
  userBranchId?: string | null; // The user's assigned branch
  correlationId?: string;
}

export class CompleteServiceOrderUseCase {
  async execute({ serviceOrderId, companyId, operationalBranchId, userId, userRole, userBranchId, correlationId }: IRequest) {
    logger.info(`[UseCase:CompleteOS] Starting execution for OS ${serviceOrderId}`, { correlationId });

    // 0. Authorization Check (Policy Layer with Branch Scope)
    const isAuthorized = PolicyEngine.can(
      { id: userId, role: userRole, companyId, branchId: userBranchId },
      Permission.SERVICE_ORDER_COMPLETE,
      { companyId, branchId: operationalBranchId, correlationId }
    );

    if (!isAuthorized) {
      throw new AppError('Unauthorized: OS completion not allowed for your role.', 403);
    }

    // 1. Fetch OS data
    const serviceOrder = await prismaClient.serviceOrder.findFirst({
      where: { id: serviceOrderId, companyId, deletedAt: null },
      include: {
        parts: true,
        services: true,
      },
    });

    if (!serviceOrder) {
      throw new AppError('Service Order not found.', 404);
    }

    // 2. Validate Status (State Machine)
    if (serviceOrder.status === ServiceOrderStatus.COMPLETED) {
      throw new AppError('Service order is already completed.', 400);
    }

    // 3. Update Status (Atomic Domain Operation)
    const updatedOS = await prismaClient.serviceOrder.update({
      where: { id: serviceOrderId },
      data: {
        status: ServiceOrderStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    // 4. Dispatch Domain Event for Asynchronous Processing
    // This allows Stock, Financial, and Reports to be processed in background
    await EventDispatcher.dispatch({
      name: 'SERVICE_ORDER_COMPLETED',
      payload: {
        orderId: serviceOrder.id,
        number: serviceOrder.number,
        companyId: serviceOrder.companyId,
        branchId: serviceOrder.branchId,
        userId: userId,
        total: serviceOrder.finalValue,
        parts: serviceOrder.parts.map(p => ({ partId: p.partId, quantity: p.quantity })),
      },
      occurredAt: new Date(),
      correlationId,
    });

    logger.info(`[UseCase:CompleteOS] OS ${serviceOrder.number} marked as COMPLETED. Events dispatched.`, { correlationId });

    return updatedOS;
  }
}
