import { z } from 'zod';

export const createClientSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long'),
  document: z.string().min(11, 'Document must be at least 11 characters long').max(14, 'Document must be at most 14 characters long'),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  address: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
});

export type CreateClientDTO = z.infer<typeof createClientSchema>;

export const updateClientSchema = createClientSchema.partial();

export type UpdateClientDTO = z.infer<typeof updateClientSchema>;
