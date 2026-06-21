// apps/api/src/shared/config/auth.ts

const secret = (process.env.JWT_SECRET || 'YOUKNOWHOOOLIVESINTHESECRET').trim();

export default {
  jwt: {
    secret,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
};
