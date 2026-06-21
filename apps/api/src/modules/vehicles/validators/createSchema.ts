import { z } from 'zod';

export const createVehicleSchema = z.object({
  clientId: z.string().uuid('Client ID must be a valid UUID'),
  plate: z.string().min(7, 'Plate must be at least 7 characters'),
  brand: z.string().min(2, 'Brand must be at least 2 characters'),
  model: z.string().min(2, 'Model must be at least 2 characters'),
  year: z.number().int().min(1900, 'Year must be at least 1900').max(new Date().getFullYear() + 1, 'Year is too far in the future'),
  color: z.string().optional(),
  chassis: z.string().optional(),
  mileage: z.number().int().min(0).optional(),
  engine: z.string().optional(),
});
