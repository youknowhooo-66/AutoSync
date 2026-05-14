// apps/api/src/modules/users/repositories/PrismaUserRepository.ts

import { PrismaClient } from '@prisma/client';
import { IUserRepository, User, UserWithPassword } from './IUserRepository';
import { CreateUserDTO, UpdateUserDTO } from '../dtos';
import { prismaClient } from '../../../shared/database/prismaClient';
import * as bcrypt from 'bcryptjs'; // Assuming bcryptjs is installed

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
        password: data.password, // Password hashing happens in the service layer
        role: data.role,
        isActive: true, // Default to active
      },
    });
    // Don't return password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findById(id: string, companyId: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        id_companyId: {
          id,
          companyId,
        },
      },
    });
    if (!user) return null;
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findByEmail(email: string, companyId: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        companyId,
      },
    });
    if (!user) return null;
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findByEmailWithPassword(email: string, companyId: string): Promise<UserWithPassword | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        companyId,
      },
    });
    return user as UserWithPassword | null; // Cast to include password for internal auth purposes
  }

  async findManyByCompany(companyId: string): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: {
        companyId,
      },
    });
    return users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  async update(data: UpdateUserDTO): Promise<User> {
    const user = await this.prisma.user.update({
      where: {
        id_companyId: {
          id: data.id,
          companyId: data.companyId,
        },
      },
      data: {
        name: data.name,
        email: data.email,
        password: data.password, // Password hashing happens in the service layer
        role: data.role,
        isActive: data.isActive,
      },
    });
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async delete(id: string, companyId: string): Promise<void> {
    await this.prisma.user.delete({
      where: {
        id_companyId: {
          id,
          companyId,
        },
      },
    });
  }
}
