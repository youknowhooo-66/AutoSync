import { IUserRepository, User } from './IUserRepository';
import { CreateUserDTO, UpdateUserDTO } from '../dtos';
import { prismaClient } from '../../../shared/database/prismaClient';
import { PrismaClient } from "@prisma/client";

export class PrismaUserRepository implements IUserRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prismaClient;
  }

  async create(data: CreateUserDTO): Promise<User> {
    const user = await this.prisma.user.create(({
          data: {
            companyId: data.companyId,
            name: data.name,
            email: data.email,
            password: data.password,
            role: data.role,
            branchId: (data as any).branchId,
          },
        } as unknown as Parameters<typeof this.prisma.user.create>[0]));
    return user as User;
  }

  async findById(id: string, companyId: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst(({
          where: {
            id,
            companyId,
            
          },
        } as unknown as Parameters<typeof this.prisma.user.findFirst>[0]));
    return user as User | null;
  }

  async findByEmail(email: string, companyId?: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst(({
          where: {
            email,
            ...(companyId ? { companyId } : {}),
            deletedAt: null,
          },
        } as unknown as Parameters<typeof this.prisma.user.findFirst>[0]));
    return user as User | null;
  }

  async findManyByCompany(companyId: string): Promise<User[]> {
    const users = await this.prisma.user.findMany(({
          where: {
            companyId,
            deletedAt: null,
          },
        } as unknown as Parameters<typeof this.prisma.user.findMany>[0]));
    return users as User[];
  }

  async update(data: UpdateUserDTO): Promise<User> {
    const user = await this.prisma.user.update(({
          where: {
            id: data.id,
            companyId: data.companyId,
          },
          data: {
            name: data.name,
            email: data.email,
            password: data.password,
            role: data.role,
            branchId: (data as any).branchId,
          },
        } as unknown as Parameters<typeof this.prisma.user.update>[0]));
    return user as User;
  }

  async delete(id: string, companyId: string): Promise<void> {
    await this.prisma.user.delete(({
          where: {
            id,
            companyId,
          },
        } as any));
  }
}

export { PrismaClient } from "@prisma/client";
