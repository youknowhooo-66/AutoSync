/**
 * correlationIdMiddleware — ensures every request has a correlation ID.
 *
 * Rules:
 *  - If the incoming `x-correlation-id` header contains a valid UUID (v4/v7
 *    or any standard 8-4-4-4-12 format) and is ≤ 100 characters, it is
 *    accepted and reused as-is.
 *  - Otherwise, a new UUID v4 is generated.
 *  - The resolved ID is:
 *      1. Set on `req.correlationId` (typed in express.d.ts).
 *      2. Returned in the response header `x-correlation-id`.
 *  - This middleware must run BEFORE all other middlewares that log or
 *    produce error responses, so the ID is always present.
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// Standard UUID pattern: 8-4-4-4-12 hex groups.
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_CORRELATION_ID_LENGTH = 100;

function isValidCorrelationId(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (value.length > MAX_CORRELATION_ID_LENGTH) return false;
  return UUID_PATTERN.test(value);
}

export function correlationIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const incoming = req.headers['x-correlation-id'];
  const candidate = Array.isArray(incoming) ? incoming[0] : incoming;

  const correlationId = isValidCorrelationId(candidate)
    ? candidate
    : randomUUID();

  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);

  next();
}
