import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';
import { normalizeInternalCode } from '../../../shared/utils/normalizeInternalCode';

interface IRequest {
  companyId: string;
  userId: string;
  name: string;
  internalCode: string;
  description?: string;
  salePrice?: number;
  purchasePrice?: number;
  initialStock?: number;
  branchId?: string;
  categoryId?: string;
}

export class CreatePartUseCase {
  async execute(data: IRequest) {
    if (!data.name || !data.internalCode) {
      throw new AppError('Name and internal code are required.', 400);
    }

    return await prismaClient.$transaction(async (tx) => {
      // 1. Check if part with same normalized code already exists in company
      const normalizedCode = normalizeInternalCode(data.internalCode);
      const partAlreadyExists = normalizedCode
        ? await tx.part.findFirst({
            where: {
              companyId: data.companyId,
              normalizedInternalCode: normalizedCode,
            }
          })
        : null;

      if (partAlreadyExists) {
        throw new AppError('Part with this internal code already exists.', 400);
      }

      // 2. Create Part
      const part = await tx.part.create({
        data: {
          companyId: data.companyId,
          name: data.name,
          internalCode: data.internalCode,
          normalizedInternalCode: normalizeInternalCode(data.internalCode),
          description: data.description,
          salePrice: data.salePrice || 0,
          purchasePrice: data.purchasePrice || 0,
          categoryId: data.categoryId,
        }
      });

      // 3. If initial stock is provided, create stock entry
      if (data.initialStock && data.initialStock > 0 && data.branchId) {
        await tx.stock.create({
          data: {
            companyId: data.companyId,
            branchId: data.branchId,
            partId: part.id,
            quantity: data.initialStock,
          }
        });

        // Record movement
        await tx.inventoryMovement.create({
          data: {
            partId: part.id,
            branchId: data.branchId,
            userId: data.userId,
            type: 'IN',
            quantity: data.initialStock,
            reason: 'Initial stock entry upon creation'
          }
        });
      }

      return part;
    });
  }
}
