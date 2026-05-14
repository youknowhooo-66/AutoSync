import { PrismaClient } from '@prisma/client';
import { AppError } from '../errors/AppError';

export class BaseRepository<T> {
  protected prisma: PrismaClient;
  protected model: any;

  constructor(prisma: PrismaClient, modelName: string) {
    this.prisma = prisma;
    this.model = (prisma as any)[modelName];
    if (!this.model) {
      throw new AppError(`Model ${modelName} not found in Prisma client.`, 500);
    }
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findUnique({ where: { id } });
  }

  async findAll(): Promise<T[]> {
    return this.model.findMany();
  }

  async create(data: any): Promise<T> {
    return this.model.create({ data });
  }

  async update(id: string, data: any): Promise<T> {
    return this.model.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.model.delete({ where: { id } });
  }
}
