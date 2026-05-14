import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

export function errorHandler(
  err: Error,
  request: Request,
  response: Response,
  _: NextFunction
) {
  if (err instanceof AppError) {
    return response.status(err.statusCode).json({
      success: false,
      error: err.message,
      statusCode: err.statusCode,
    });
  }

  if (err.name === 'ZodError') {
    return response.status(400).json({
      success: false,
      error: 'Validation error',
      details: (err as any).format(),
      statusCode: 400,
    });
  }

  console.error(err);

  return response.status(500).json({
    success: false,
    error: 'Internal server error',
    statusCode: 500,
  });
}
