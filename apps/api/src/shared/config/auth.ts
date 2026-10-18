// apps/api/src/shared/config/auth.ts
import { env } from './env';

// JWT_SECRET is validated by env.ts (min. 16 chars). There is intentionally
// no fallback: the process must not start with a guessable signing key.
export default {
  jwt: {
    secret: env.JWT_SECRET.trim(),
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
};
