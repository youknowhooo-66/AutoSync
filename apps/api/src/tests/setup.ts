import { prismaClient } from '../shared/database/prismaClient';
import { redisClient } from '../shared/infra/redis/RedisClient';

beforeAll(async () => {
  // Clear database or other setup
});

afterAll(async () => {
  await prismaClient.$disconnect();
  await redisClient.quit();
});
