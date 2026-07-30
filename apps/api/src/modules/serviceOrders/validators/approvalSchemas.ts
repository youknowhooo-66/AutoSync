import { z } from 'zod';

export const rejectApprovalSchema = z.object({
  reason: z.string().min(5, 'O motivo da rejeição deve ter pelo menos 5 caracteres')
});

export const invalidateApprovalSchema = z.object({
  reason: z.string().min(5, 'O motivo da invalidação deve ter pelo menos 5 caracteres')
});
