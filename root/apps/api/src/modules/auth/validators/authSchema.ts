import { z } from 'zod';

export const authenticateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  companyId: z.string().uuid('Invalid Company ID'),
});
