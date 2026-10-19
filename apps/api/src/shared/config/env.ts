import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production', 'staging'])
    .default('development'),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().url(),
  /**
   * JWT_SECRET must be a non-empty string. There is intentionally no
   * insecure fallback — the application will refuse to start without it.
   */
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  // Redis: prefer REDIS_URL (single connection string) over individual parts.
  // QueueProvider and RedisClient each parse the value they consume.
  REDIS_URL: z.string().url().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  // Comma-separated origins. '*' is refused in production/staging (see below); the
  // dev default matches the Vite dev server so the session cookie works locally.
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  // Number of reverse proxies in front of the API (Caddy = 1). Drives req.ip, which
  // the rate limiter keys on; 0 means "trust nothing", so X-Forwarded-For is ignored.
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  // Session cookie "Secure" flag. Unset = on in production/staging. Only for running the
  // production image over plain http://localhost, where Safari drops Secure cookies.
  COOKIE_SECURE: z.enum(['true', 'false']).optional(),
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'])
    .default('info'),
  // Injected by CI/CD pipelines; used in /health/live version field.
  APP_VERSION: z.string().optional(),
  GIT_SHA: z.string().optional(),
  // Metrics endpoint guard token. If absent, the /metrics route is disabled.
  METRICS_TOKEN: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  // Log field-level errors without printing env values.
  const formatted = _env.error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
  // Use console.error here intentionally — logger depends on env and is not
  // yet available at this point.
  console.error('[Startup] Invalid environment variables:', JSON.stringify(formatted, null, 2));
  throw new Error('Invalid environment variables — check startup logs for details.');
}

if ((_env.data.NODE_ENV === 'production' || _env.data.NODE_ENV === 'staging') && _env.data.CORS_ORIGIN.split(',').some((o) => o.trim() === '*')) {
  console.error('[Startup] CORS_ORIGIN must list explicit origins in production; "*" is not allowed.');
  throw new Error('Invalid environment variables — CORS_ORIGIN cannot be "*" in production.');
}

export const env = _env.data;
