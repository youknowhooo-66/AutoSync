import { z } from 'zod';

export const updateVehicleSchema = z.object({
  id: z.string().uuid('Invalid ID'),
  clientId: z.string().uuid('Client ID must be a valid UUID').optional(),
  plate: z.string().min(7, 'Plate must be at least 7 characters').optional(),
  brand: z.string().min(2, 'Brand must be at least 2 characters').optional(),
  model: z.string().min(2, 'Model must be at least 2 characters').optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  color: z.string().optional(),
  chassis: z.string().optional(),
  mileage: z.number().int().min(0).optional(),
  engine: z.string().optional(),
});
