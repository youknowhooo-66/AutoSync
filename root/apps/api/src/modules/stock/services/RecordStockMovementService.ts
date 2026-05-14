import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';
import { AuditLogService } from '../../../shared/audit/AuditLogService';

interface IMovementRequest {
  companyId: string;
  userId: string;
  partId: string;
  branchId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER' | 'RETURN';
  quantity: number;
  reason?: string;
  sourceBranchId?: string;
  targetBranchId?: string;
}

export class RecordStockMovementService {
  async execute(data: IMovementRequest) {
    const { 
      companyId, 
      userId, 
      partId, 
      branchId, 
      type, 
      quantity, 
      reason, 
      sourceBranchId, 
      targetBranchId 
    } = data;

    return await prismaClient.$transaction(async (tx) => {
      // 1. Get current stock
      const stock = await tx.stock.findUnique({
        where: {
          partId_branchId: {
            partId,
            branchId,
          },
        },
      });

      let currentQuantity = stock ? stock.quantity : 0;
      let newQuantity = currentQuantity;

      // 2. Calculate new quantity and validate
      if (['OUT', 'TRANSFER'].includes(type)) {
        if (currentQuantity < quantity) {
          throw new AppError('Insufficient stock for this operation.', 400);
        }
        newQuantity -= quantity;
      } else if (['IN', 'RETURN'].includes(type)) {
        newQuantity += quantity;
      } else if (type === 'ADJUSTMENT') {
        newQuantity = quantity; // In adjustments, quantity is the target value
      }

      // 3. Update or Create Stock record
      const updatedStock = await tx.stock.upsert({
        where: {
          partId_branchId: {
            partId,
            branchId,
          },
        },
        update: {
          quantity: newQuantity,
        },
        create: {
          partId,
          branchId,
          companyId, // Ensure companyId is passed if needed (Stock model should have it based on schema)
          quantity: newQuantity,
        },
      });

      // 4. Create Movement record
      const movement = await tx.inventoryMovement.create({
        data: {
          partId,
          branchId,
          userId,
          type,
          quantity,
          reason,
          sourceBranchId,
          targetBranchId,
        },
      });

      // 5. Audit Log
      await AuditLogService.log({
        userId,
        companyId,
        action: `STOCK_MOVEMENT_${type}`,
        resource: 'STOCK',
        resourceId: updatedStock.id,
        oldValue: { quantity: currentQuantity },
        newValue: { quantity: newQuantity },
      });

      return { updatedStock, movement };
    });
  }
}
