import { z } from 'zod';

export const movementSchema = z.object({
  partId: z.string().uuid('Invalid part ID'),
  branchId: z.string().uuid('Invalid branch ID'),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'RETURN']),
  quantity: z.number().int().positive('Quantity must be positive'),
  reason: z.string().optional(),
  sourceBranchId: z.string().uuid().optional(),
  targetBranchId: z.string().uuid().optional(),
});
