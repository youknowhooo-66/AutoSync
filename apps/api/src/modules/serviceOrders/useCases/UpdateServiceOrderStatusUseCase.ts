import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';
import { OSStatus } from '@prisma/client';

export class UpdateServiceOrderStatusUseCase {
  async execute(id: string, companyId: string, status: string) {
    const os = await prismaClient.serviceOrder.findFirst({
      where: { id, companyId },
    });

    if (!os) {
      throw new AppError('Service Order not found.', 404);
    }

    let dbStatus: OSStatus = status as OSStatus;
    if (status === 'COMPLETED' || status === 'BILLED' || status === 'FINISHED') dbStatus = 'FINISHED';
    if (status === 'CANCELED' || status === 'CANCELLED') dbStatus = 'CANCELLED';
    if (status === 'DIAGNOSIS') dbStatus = 'IN_PROGRESS';
    if (status === 'WAITING_PARTS' || status === 'AWAITING_PARTS') dbStatus = 'AWAITING_PARTS';

    const validStatuses: OSStatus[] = ['OPEN', 'IN_PROGRESS', 'AWAITING_PARTS', 'FINISHED', 'CANCELLED'];
    if (!validStatuses.includes(dbStatus)) {
      throw new AppError(`Status inválido: ${status}`, 400);
    }

    const currentStatus = os.status as OSStatus;

    if (currentStatus === dbStatus) {
      return os;
    }

    // Terminal states check
    if (currentStatus === 'FINISHED' || currentStatus === 'CANCELLED') {
      throw new AppError(
        `Não é possível alterar o status de uma Ordem de Serviço já ${currentStatus === 'FINISHED' ? 'Finalizada' : 'Cancelada'}.`,
        422,
        'INVALID_STATUS_TRANSITION',
        [
          {
            path: 'status',
            message: `Ordem de Serviço está em estado terminal: ${currentStatus}`,
            code: 'INVALID_STATUS_TRANSITION'
          }
        ]
      );
    }

    // Block direct transition to FINISHED via status patch
    if (dbStatus === 'FINISHED') {
      throw new AppError(
        'Para concluir a Ordem de Serviço, utilize a seção de Encerramento.',
        400
      );
    }

    // Transition matrix
    const ALLOWED_TRANSITIONS: Record<OSStatus, OSStatus[]> = {
      OPEN: ['IN_PROGRESS', 'AWAITING_PARTS', 'CANCELLED'],
      IN_PROGRESS: ['AWAITING_PARTS', 'FINISHED', 'CANCELLED'],
      AWAITING_PARTS: ['IN_PROGRESS', 'CANCELLED'],
      FINISHED: [],
      CANCELLED: []
    };

    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(dbStatus)) {
      throw new AppError(
        `Transição de status inválida de ${currentStatus} para ${dbStatus}.`,
        422,
        'INVALID_STATUS_TRANSITION',
        [
          {
            path: 'status',
            message: `Transição não permitida de ${currentStatus} para ${dbStatus}`,
            code: 'INVALID_STATUS_TRANSITION'
          }
        ]
      );
    }

    const updated = await prismaClient.serviceOrder.update({
      where: { id },
      data: { status: dbStatus },
    });

    return updated;
  }
}
