import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';
import { AuditLogService } from '../../../shared/audit/AuditLogService';
import { Prisma } from '@prisma/client';

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

      const currentQuantity = stock ? new Prisma.Decimal(stock.quantity) : new Prisma.Decimal(0);
      const qtyDecimal = new Prisma.Decimal(quantity);
      let newQuantity = currentQuantity;

      // 2. Calculate new quantity and validate
      if (['OUT', 'TRANSFER'].includes(type)) {
        if (currentQuantity.lessThan(qtyDecimal)) {
          throw new AppError('Insufficient stock for this operation.', 400);
        }
        newQuantity = currentQuantity.sub(qtyDecimal);
      } else if (['IN', 'RETURN'].includes(type)) {
        newQuantity = currentQuantity.add(qtyDecimal);
      } else if (type === 'ADJUSTMENT') {
        newQuantity = qtyDecimal; // In adjustments, quantity is the target value
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
          quantity: new Prisma.Decimal(quantity),
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
