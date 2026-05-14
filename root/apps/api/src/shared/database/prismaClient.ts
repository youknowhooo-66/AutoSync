import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';
import { logger } from '../utils/Logger';

const prismaClient = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export { prismaClient };
