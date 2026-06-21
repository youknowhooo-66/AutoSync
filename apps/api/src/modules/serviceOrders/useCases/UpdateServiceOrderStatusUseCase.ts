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
    if (status === 'COMPLETED' || status === 'BILLED') dbStatus = 'FINISHED';
    if (status === 'CANCELED') dbStatus = 'CANCELLED';
    if (status === 'DIAGNOSIS') dbStatus = 'IN_PROGRESS';

    const updated = await prismaClient.serviceOrder.update({
      where: { id },
      data: { status: dbStatus },
    });

    return updated;
  }
}
