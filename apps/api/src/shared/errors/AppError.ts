/**
 * AppError — base application error with an optional machine-readable code.
 *
 * The `errorCode` field is used in the uniform error envelope so clients can
 * handle specific conditions programmatically without parsing message strings.
 *
 * Example:
 *   throw new AppError('Ordem de serviço não encontrada.', 404, 'SERVICE_ORDER_NOT_FOUND');
 */

export type ErrorDetail = {
  path?: string;
  code?: string;
  message: string;
};

class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details: ErrorDetail[];

  constructor(
    message: string,
    statusCode: number = 400,
    errorCode: string = 'APP_ERROR',
    details: ErrorDetail[] = [],
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}

export { AppError };
