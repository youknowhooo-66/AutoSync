import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { ZodError } from 'zod';
import { logger } from '../logger';

export const errorHandler = (
  err: Error,
  request: Request,
  response: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.warn(`AppError: ${err.message}`, { statusCode: err.statusCode, path: request.path });
    return response.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  if (err instanceof ZodError) {
    logger.warn('Validation error', { errors: err.errors, path: request.path });
    return response.status(400).json({
      status: 'error',
      message: 'Validation error',
      errors: err.errors.map(e => ({
        path: e.path,
        message: e.message
      })),
    });
  }

  logger.error('Internal server error', err, { path: request.path });

  return response.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
};
