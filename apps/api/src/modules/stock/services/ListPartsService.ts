import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';

export class ListPartsService {
  async execute(companyId: string) {
    if (!companyId) {
      throw new AppError('Company ID is required.');
    }

    const parts = await prismaClient.part.findMany({
      where: { companyId, deletedAt: null },
      include: {
        stocks: {
          include: {
            branch: { select: { name: true } }
          }
        }
      }
    });

    return parts;
  }
}
