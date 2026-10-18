import { z } from 'zod';

/** What a tenant may edit about its own company. Activation and onboarding are system-level. */
export const updateCompanySchema = z.object({
  name: z.string().trim().min(2).optional(),
  document: z.string().trim().min(11).optional(),
  address: z.string().trim().nullable().optional(),
  city: z.string().trim().nullable().optional(),
  state: z.string().trim().nullable().optional(),
  zipCode: z.string().trim().nullable().optional(),
  phone: z.string().trim().nullable().optional(),
  email: z.string().trim().email().nullable().optional().or(z.literal('')),
});
