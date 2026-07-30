import { env } from '../config/env';
import { logger } from '../utils/Logger';
import { PrismaClient } from "@prisma/client";

const prismaClient = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export { prismaClient };
export { PrismaClient } from "@prisma/client";
