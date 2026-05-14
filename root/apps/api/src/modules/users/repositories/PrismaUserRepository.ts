import { PrismaClient } from '@prisma/client';
import { IUserRepository, User } from './IUserRepository';
import { CreateUserDTO, UpdateUserDTO } from '../dtos';
import { prismaClient } from '../../../shared/database/prismaClient';

export class PrismaUserRepository implements IUserRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prismaClient;
  }

  async create(data: CreateUserDTO): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        companyId: data.companyId,
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        branchId: data.branchId,
      },
    });
    return user as User;
  }

  async findById(id: string, companyId: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
    });
    return user as User | null;
  }

  async findByEmail(email: string, companyId?: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        ...(companyId ? { companyId } : {}),
        deletedAt: null,
      },
    });
    return user as User | null;
  }

  async findManyByCompany(companyId: string): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: {
        companyId,
        deletedAt: null,
      },
    });
    return users as User[];
  }

  async update(data: UpdateUserDTO): Promise<User> {
    const user = await this.prisma.user.update({
      where: {
        id: data.id,
        companyId: data.companyId,
      },
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        branchId: data.branchId,
      },
    });
    return user as User;
  }

  async delete(id: string, companyId: string): Promise<void> {
    await this.prisma.user.update({
      where: {
        id,
        companyId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
