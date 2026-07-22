type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class NamespacedLogger {
  private namespace: string;

  constructor(namespace: string) {
    this.namespace = namespace;
  }

  private log(level: LogLevel, message: string, data?: any) {
    const isProd = import.meta.env.PROD;

    if (level === 'debug' && isProd) {
      return; // No-op in production for debug logs
    }

    const prefix = `[${this.namespace.toUpperCase()}] [${level.toUpperCase()}]`;

    switch (level) {
      case 'debug':
        if (data !== undefined) console.debug(prefix, message, data);
        else console.debug(prefix, message);
        break;
      case 'info':
        if (data !== undefined) console.info(prefix, message, data);
        else console.info(prefix, message);
        break;
      case 'warn':
        if (data !== undefined) console.warn(prefix, message, data);
        else console.warn(prefix, message);
        break;
      case 'error':
        if (data !== undefined) console.error(prefix, message, data);
        else console.error(prefix, message);
        break;
    }
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, data?: any) {
    this.log('error', message, data);
  }
}

export const logger = {
  api: new NamespacedLogger('api'),
  auth: new NamespacedLogger('auth'),
  query: new NamespacedLogger('query'),
  audit: new NamespacedLogger('audit'),
  ui: new NamespacedLogger('ui'),
};

export default logger;
