import { z } from 'zod';

export const createServiceOrderSchema = z.object({
  clientId: z.string().uuid('Invalid client ID'),
  vehicleId: z.string().uuid('Invalid vehicle ID'),
  branchId: z.string().uuid('Invalid branch ID'),
  mechanicId: z.string().uuid().optional(),
  notes: z.string().optional(),
  parts: z.array(z.object({
    partId: z.string().uuid(),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
  })).optional(),
  services: z.array(z.object({
    name: z.string(),
    price: z.number().positive(),
  })).optional(),
});
