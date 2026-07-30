import { IUserRepository, User } from './IUserRepository';
import { CreateUserDTO, UpdateUserDTO } from '../dtos';
import { prismaClient } from '../../../shared/database/prismaClient';
import { PrismaClient, Prisma } from "@prisma/client";

export class PrismaUserRepository implements IUserRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prismaClient;
  }

  async create(data: CreateUserDTO): Promise<User> {
    const createData: Prisma.UserUncheckedCreateInput = {
      companyId: data.companyId,
      name: data.name,
      email: data.email,
      password: data.password || '',
      role: data.role as any,
      branchId: (data as any).branchId || null,
    };

    const user = await this.prisma.user.create({
      data: createData,
    });
    return user as User;
  }

  async findById(id: string, companyId: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        companyId,
      },
    });
    return user as User | null;
  }

  async findByEmail(email: string, companyId?: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        ...(companyId ? { companyId } : {}),
      },
    });
    return user as User | null;
  }

  async findManyByCompany(companyId: string): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: {
        companyId,
      },
    });
    return users as User[];
  }

  async update(data: UpdateUserDTO): Promise<User> {
    const updateData: Prisma.UserUncheckedUpdateInput = {
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role as any,
      branchId: (data as any).branchId || null,
    };

    const user = await this.prisma.user.update({
      where: {
        id: data.id,
      },
      data: updateData,
    });
    return user as User;
  }

  async delete(id: string, companyId: string): Promise<void> {
    await this.prisma.user.delete({
      where: {
        id,
      },
    });
  }
}

export { PrismaClient } from "@prisma/client";
