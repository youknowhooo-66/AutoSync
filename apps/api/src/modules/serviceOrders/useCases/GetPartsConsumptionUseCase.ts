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
        const stock = await prismaClient.stock.findFirst({
          where: {
            partId: p.partId,
            companyId,
            branchId: os.branchId
          }
        });

        return {
          partId: p.id, // OSPart ID
          realPartId: p.partId,
          name: p.part.name,
          sku: p.part.internalCode || '',
          plannedQuantity: p.quantity,
          consumedQuantity: p.consumedQuantity,
          remainingQuantity: Math.max(0, p.quantity - p.consumedQuantity),
          availableStock: stock ? stock.quantity : 0,
          movements: p.movements.map((m) => ({
            id: m.id,
            quantity: m.quantity,
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
