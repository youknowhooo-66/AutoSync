import { z } from 'zod';

export const createFinancialRecordSchema = z.object({
  branchId: z.string().uuid('Invalid branch ID'),
  type: z.enum(['PAYABLE', 'RECEIVABLE']), // Matching schema enums
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  dueDate: z.string().datetime(),
  status: z.enum(['PENDING', 'PAID', 'CANCELLED']).default('PENDING'),
});
