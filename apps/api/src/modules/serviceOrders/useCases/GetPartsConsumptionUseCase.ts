import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';

export class GetPartsConsumptionUseCase {
  async execute(serviceOrderId: string, companyId: string) {
    const os = await prismaClient.serviceOrder.findFirst({
      where: { id: serviceOrderId, companyId }
    });

    if (!os) {
      throw new AppError('Ordem de Serviço não encontrada', 404);
    }

    const parts = await prismaClient.oSPart.findMany({
      where: { serviceOrderId },
      include: {
        part: true,
        movements: {
          include: {
            user: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    // For each part, find the local stock available at the OS branch
    const list = await Promise.all(
      parts.map(async (p) => {
        const stock = p.partId ? await prismaClient.stock.findFirst({
          where: {
            partId: p.partId,
            companyId,
            branchId: os.branchId
          }
        }) : null;

        return {
          partId: p.id, // OSPart ID
          realPartId: p.partId,
          name: p.part?.name || p.description || '',
          sku: p.part?.internalCode || '',
          plannedQuantity: Number(p.quantity),
          consumedQuantity: Number(p.consumedQuantity),
          remainingQuantity: Math.max(0, Number(p.quantity) - Number(p.consumedQuantity)),
          availableStock: stock ? Number(stock.quantity) : 0,
          movements: p.movements.map((m) => ({
            id: m.id,
            quantity: Number(m.quantity),
            performedById: m.userId,
            performedByName: m.user.name,
            createdAt: m.createdAt
          }))
        };
      })
    );

    return list;
  }
}
