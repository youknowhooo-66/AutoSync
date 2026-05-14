// apps/api/src/modules/clients/repositories/PrismaClientRepository.ts

import { PrismaClient } from '@prisma/client';
import { IClientRepository, Client } from './IClientRepository';
import { CreateClientDTO, UpdateClientDTO } from '../dtos';
import { prismaClient } from '../../../shared/database/prismaClient';

export class PrismaClientRepository implements IClientRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prismaClient;
  }

  async create(data: CreateClientDTO): Promise<Client> {
    const client = await this.prisma.client.create({
      data: {
        companyId: data.companyId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        document: data.document,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
      },
    });
    return client;
  }

  async findById(id: string, companyId: string): Promise<Client | null> {
    const client = await this.prisma.client.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
    });
    return client;
  }

  async findByName(name: string, companyId: string): Promise<Client | null> {
    const client = await this.prisma.client.findFirst({
      where: {
        name,
        companyId,
        deletedAt: null,
      },
    });
    return client;
  }

  async findManyByCompany(companyId: string): Promise<Client[]> {
    const clients = await this.prisma.client.findMany({
      where: {
        companyId,
        deletedAt: null,
      },
    });
    return clients;
  }

  async update(data: UpdateClientDTO): Promise<Client> {
    const client = await this.prisma.client.update({
      where: {
        id: data.id,
        companyId: data.companyId,
      },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        document: data.document,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
      },
    });
    return client;
  }

  async delete(id: string, companyId: string): Promise<void> {
    await this.prisma.client.update({
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
