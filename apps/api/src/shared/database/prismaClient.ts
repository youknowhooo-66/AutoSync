import { env } from '../config/env';
import { PrismaClient } from "@prisma/client";

const prismaClient = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export { prismaClient };
