// apps/api/src/shared/config/auth.ts

export default {
  jwt: {
    secret: process.env.AUTH_JWT_SECRET || 'default-secret',
    expiresIn: process.env.AUTH_JWT_EXPIRES_IN || '1d',
  },
};
