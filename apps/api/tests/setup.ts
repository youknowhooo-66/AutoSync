import path from 'path';
import dotenv from 'dotenv';

// Inject Jest compatibility layer
(global as any).jest = vi;

// Load env.test variables BEFORE any imports that instantiate database/redis clients
const envPath = path.resolve(__dirname, '../.env.test');
dotenv.config({ path: envPath });

import { prismaClient } from '../src/shared/database/prismaClient';
import { redisClient } from '../src/shared/infra/redis/RedisClient';
import { truncateDatabase } from './helpers/db';

beforeAll(async () => {
  // Clean up database before starting the test suite
  await truncateDatabase();
}, 30000);

afterEach(async () => {
  // Truncate tables to guarantee test isolation
  await truncateDatabase();
}, 30000);

afterAll(async () => {
  // Gracefully close active prisma and redis connections
  await prismaClient.$disconnect();
  try {
    await redisClient.quit();
  } catch (err) {
    // Avoid crashing if redis wasn't connected
  }
}, 30000);
