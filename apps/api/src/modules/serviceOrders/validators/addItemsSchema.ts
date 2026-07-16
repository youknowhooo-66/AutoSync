import { z } from 'zod';

export const addItemsSchema = z.object({
  parts: z.array(
    z.object({
      stockId: z.string().uuid('Invalid stock item ID'),
      quantity: z.number().int().positive('Part quantity must be a positive integer'),
      unitPrice: z.string().optional(),
    })
  ).optional(),
  services: z.array(
    z.object({
      description: z.string().min(3, 'Service description must be at least 3 characters'),
      quantity: z.number().positive('Service quantity must be positive'),
      unitPrice: z.string().min(1, 'Service unit price is required'),
    })
  ).optional(),
}).refine(data => {
  const partsLen = data.parts?.length || 0;
  const servicesLen = data.services?.length || 0;
  return partsLen > 0 || servicesLen > 0;
}, {
  message: 'You must provide at least one part or service to add.',
  path: ['parts'], // target path
});
