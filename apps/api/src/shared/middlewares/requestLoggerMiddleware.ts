/**
 * requestLoggerMiddleware — structured per-request logging via Pino.
 *
 * Produces ONE log line per completed request (success or failure):
 *  { method, path, statusCode, durationMs, correlationId, companyId, branchId, userId? }
 *
 * Body is never logged regardless of route to prevent leaking PII or
 * credentials. An allowlist approach will be used if body tracing is needed
 * in future.
 *
 * This middleware must run AFTER correlationIdMiddleware so correlationId is
 * already populated on the request object.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';

export function requestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const startedAt = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    const statusCode = res.statusCode;

    const logPayload: Record<string, unknown> = {
      method: req.method,
      path: req.path,
      statusCode,
      durationMs,
      correlationId: req.correlationId,
    };

    // Include tenant context only when available (set by authMiddleware).
    if (req.companyId) logPayload['companyId'] = req.companyId;
    if (req.branchId) logPayload['branchId'] = req.branchId;
    // userId is safe to log when present.
    if (req.user?.id) logPayload['userId'] = req.user.id;

    if (statusCode >= 500) {
      logger.error(logPayload, 'request failed');
    } else if (statusCode >= 400) {
      logger.warn(logPayload, 'request completed with client error');
    } else {
      logger.info(logPayload, 'request completed');
    }
  });

  next();
}
