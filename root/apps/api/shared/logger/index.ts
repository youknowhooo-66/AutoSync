// back/shared/logger/index.ts

interface Logger {
  info(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>): void;
  error(message: string, error?: Error, context?: Record<string, any>): void;
  debug(message: string, context?: Record<string, any>): void;
}

class ConsoleLogger implements Logger {
  private log(level: string, message: string, context?: Record<string, any>, error?: Error) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(context && Object.keys(context).length > 0 && { context }),
      ...(error && { error: { message: error.message, stack: error.stack } }),
    };
    console.log(JSON.stringify(logEntry));
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('INFO', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('WARN', message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log('ERROR', message, context, error);
  }

  debug(message: string, context?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      this.log('DEBUG', message, context);
    }
  }
}

export const logger: Logger = new ConsoleLogger();
