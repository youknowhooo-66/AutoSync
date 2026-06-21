import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  document: z.string().min(11, 'Document must be at least 11 characters (CPF/CNPJ)'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional(),
});
