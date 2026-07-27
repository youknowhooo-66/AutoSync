import { z } from 'zod';

/**
 * Zod schema for validating query parameters of GET /api/inventory/parts.
 *
 * - q: optional search term (min 2 chars when present, trimmed to undefined when empty)
 * - page / pageSize: pagination
 * - availability: filter by stock availability
 * - sortBy: sort dimension
 * - sortOrder: sort direction (defaults to DESC for RELEVANCE, ASC otherwise)
 * - branchId: optional UUID to scope stock quantities to a specific branch
 */
export const searchPartsQuerySchema = z.object({
  q: z.preprocess(
    (value) => {
      if (typeof value !== 'string') return value;
      const trimmed = value.trim();
      return trimmed === '' ? undefined : trimmed;
    },
    z.string().min(2, 'Search term must be at least 2 characters').max(100).optional(),
  ),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  availability: z.enum(['ALL', 'AVAILABLE', 'OUT_OF_STOCK']).default('ALL'),
  sortBy: z.enum(['RELEVANCE', 'NAME', 'SKU', 'AVAILABLE_QUANTITY']).default('RELEVANCE'),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  branchId: z.string().uuid('branchId must be a valid UUID').optional(),
});

export type SearchPartsQuery = z.infer<typeof searchPartsQuerySchema>;
