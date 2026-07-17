/**
 * errorHandler — Express global error handler.
 *
 * Produces a uniform JSON envelope:
 * {
 *   error: { code, message, details, correlationId }
 * }
 *
 * For backwards compatibility with existing tests and frontend consumers,
 * the top-level legacy fields (success, message, statusCode) are also
 * preserved alongside the new envelope. They will be phased out in a future
 * API version.
 *
 * Prisma error mapping (centralised here as fallback — use cases with
 * specific semantics may throw AppError with their own codes before reaching
 * this handler):
 *   P2002 (unique constraint)       → 409 DUPLICATE_RECORD
 *   P2003 (foreign key violation)   → 409 FOREIGN_KEY_VIOLATION
 *   P2025 (record not found)        → 404 RECORD_NOT_FOUND
 *   PrismaClientInitializationError → 503 DATABASE_UNAVAILABLE
 *   P1001 / P1008 (network/timeout) → 503 DATABASE_UNAVAILABLE
 *   other Prisma errors             → 500 INTERNAL_ERROR
 *
 * In production / staging, stack traces and internal meta are never sent
 * to the client. They are logged internally by this handler.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorDetail } from '../errors/AppError';
import { Prisma } from '@prisma/client';
import { logger } from '../logger';
import { env } from '../config/env';

const isProd = env.NODE_ENV === 'production' || env.NODE_ENV === 'staging';

function buildEnvelope(
  code: string,
  message: string,
  details: ErrorDetail[],
  correlationId: string,
) {
  return {
    error: { code, message, details, correlationId },
  };
}

function legacyFields(statusCode: number, message: string) {
  return { success: false, message, statusCode, error: message };
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): Response {
  const correlationId = req.correlationId ?? 'unknown';

  // ── AppError ─────────────────────────────────────────────────────────────
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      ...legacyFields(err.statusCode, err.message),
      // Keep top-level 'details' for backwards compat with existing consumers.
      ...(err.details.length > 0 && { details: err.details }),
      ...buildEnvelope(err.errorCode, err.message, err.details, correlationId),
    });
  }

  // ── Zod validation errors ─────────────────────────────────────────────────
  if (err.name === 'ZodError') {
    const zodErr = err as unknown as { issues: Array<{ path: string[]; message: string; code: string }> };
    const details: ErrorDetail[] = (zodErr.issues ?? []).map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    }));
    const firstIssue = zodErr.issues?.[0];
    const humanMessage = firstIssue
      ? `${firstIssue.path.join(' → ') || 'Campo'}: ${firstIssue.message}`
      : 'Dados inválidos. Verifique os campos e tente novamente.';

    return res.status(400).json({
      ...legacyFields(400, humanMessage),
      ...buildEnvelope('VALIDATION_ERROR', humanMessage, details, correlationId),
    });
  }

  // ── Prisma known request errors ───────────────────────────────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    logger.warn(
      { prismaCode: err.code, correlationId },
      `[ErrorHandler] Prisma known error: ${err.code}`,
    );

    switch (err.code) {
      case 'P2002':
        return res.status(409).json({
          ...legacyFields(409, 'Registro duplicado.'),
          ...buildEnvelope('DUPLICATE_RECORD', 'Registro duplicado.', [], correlationId),
        });
      case 'P2003':
        return res.status(409).json({
          ...legacyFields(409, 'Violação de integridade referencial.'),
          ...buildEnvelope('FOREIGN_KEY_VIOLATION', 'Violação de integridade referencial.', [], correlationId),
        });
      case 'P2025':
        return res.status(404).json({
          ...legacyFields(404, 'Registro não encontrado.'),
          ...buildEnvelope('RECORD_NOT_FOUND', 'Registro não encontrado.', [], correlationId),
        });
      case 'P1001':
      case 'P1008':
        return res.status(503).json({
          ...legacyFields(503, 'Banco de dados temporariamente indisponível.'),
          ...buildEnvelope('DATABASE_UNAVAILABLE', 'Banco de dados temporariamente indisponível.', [], correlationId),
        });
      default:
        logger.error(
          { err, correlationId },
          '[ErrorHandler] Unhandled Prisma known error',
        );
        return res.status(500).json({
          ...legacyFields(500, 'Erro interno.'),
          ...buildEnvelope('INTERNAL_ERROR', 'Erro interno.', [], correlationId),
        });
    }
  }

  // ── Prisma initialization / network errors ───────────────────────────────
  if (
    err instanceof Prisma.PrismaClientInitializationError ||
    err instanceof Prisma.PrismaClientRustPanicError
  ) {
    logger.error({ err, correlationId }, '[ErrorHandler] Prisma initialization error');
    return res.status(503).json({
      ...legacyFields(503, 'Banco de dados temporariamente indisponível.'),
      ...buildEnvelope('DATABASE_UNAVAILABLE', 'Banco de dados temporariamente indisponível.', [], correlationId),
    });
  }

  // ── JWT errors ────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      ...legacyFields(401, 'Token inválido ou expirado.'),
      ...buildEnvelope('UNAUTHORIZED', 'Token inválido ou expirado.', [], correlationId),
    });
  }

  // ── Unknown / unhandled error ─────────────────────────────────────────────
  logger.error({ err, correlationId }, '[ErrorHandler] Unhandled error');

  return res.status(500).json({
    ...legacyFields(500, 'Erro interno.'),
    ...buildEnvelope('INTERNAL_ERROR', 'Erro interno.', [], correlationId),
    // Stack trace only in development (never in production/staging).
    ...(isProd ? {} : { stack: err.stack }),
  });
}
