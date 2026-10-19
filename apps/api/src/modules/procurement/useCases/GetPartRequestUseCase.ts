import { prismaClient as defaultPrisma } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';
import { ActorContext } from './CreatePartRequestUseCase';

export class GetPartRequestUseCase {
  constructor(private prisma: typeof defaultPrisma = defaultPrisma) {}

  async execute(id: string, actor: ActorContext) {
    const pr = await this.prisma.purchaseRequest.findFirst({
      where: {
        id,
        companyId: actor.companyId,
        branchId: actor.branchId,
      },
      include: {
        createdByUser: { select: { id: true, name: true, email: true } },
        viewedByUser: { select: { id: true, name: true, email: true } },
        purchasedByUser: { select: { id: true, name: true, email: true } },
        receivedByUser: { select: { id: true, name: true, email: true } },
        installedByUser: { select: { id: true, name: true, email: true } },
        supplier: { select: { id: true, name: true } },
        part: { select: { id: true, name: true, internalCode: true } },
        events: {
          include: {
            actor: { select: { id: true, name: true, role: true } },
          },
          orderBy: { occurredAt: 'desc' },
        },
      },
    });

    if (!pr) {
      throw new AppError('Solicitação de peça não encontrada para o tenant/filial.', 404);
    }

    return pr;
  }
}
