import crypto from 'crypto';
import { prismaClient as defaultPrisma } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';
import { ActorContext } from './CreatePartRequestUseCase';

export class SuggestCodeUseCase {
  constructor(private prisma: typeof defaultPrisma = defaultPrisma) {}

  private generateInternalCode(): string {
    const year = new Date().getFullYear();
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `PEC-${year}-${randomHex}`;
  }

  async execute(purchaseRequestId: string, actor: ActorContext): Promise<string> {
    const pr = await this.prisma.purchaseRequest.findFirst({
      where: { id: purchaseRequestId, companyId: actor.companyId, branchId: actor.branchId },
    });

    if (!pr) {
      throw new AppError('Solicitação de peça não encontrada para o tenant/filial.', 404);
    }

    let suggestedCode = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      suggestedCode = this.generateInternalCode();
      const normalized = suggestedCode.toLowerCase();
      const existing = await this.prisma.part.findFirst({
        where: { companyId: actor.companyId, normalizedInternalCode: normalized },
      });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    return suggestedCode;
  }
}
