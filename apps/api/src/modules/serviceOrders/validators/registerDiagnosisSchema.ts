import { z } from 'zod';

export const registerDiagnosisSchema = z.object({
  description: z.string().min(5, 'Diagnosis description must be at least 5 characters long').max(1000, 'Diagnosis description is too long'),
});
