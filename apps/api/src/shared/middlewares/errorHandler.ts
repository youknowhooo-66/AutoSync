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
      message: err.message,
      error: err.message,
      statusCode: err.statusCode,
      ...(err.details !== undefined && { details: err.details }),
    });
  }

  if (err.name === 'ZodError') {
    const zodErr = err as any;
    const firstIssue = zodErr.issues?.[0];
    const humanMessage = firstIssue
      ? `${firstIssue.path.join(' → ') || 'Campo'}: ${firstIssue.message}`
      : 'Dados inválidos. Verifique os campos e tente novamente.';

    return response.status(400).json({
      success: false,
      message: humanMessage,
      error: 'Validation error',
      details: zodErr.format(),
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
