// apps/api/src/modules/companies/repositories/PrismaCompanyRepository.ts

import { PrismaClient } from '@prisma/client';
import { ICompanyRepository, Company } from './ICompanyRepository';
import { CreateCompanyDTO, UpdateCompanyDTO } from '../dtos';
import { prismaClient } from '../../../shared/database/prismaClient';

export class PrismaCompanyRepository implements ICompanyRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prismaClient;
  }

  async create(data: CreateCompanyDTO): Promise<Company> {
    const company = await this.prisma.company.create({
      data: {
        name: data.name,
        document: data.document,
        address: data.address,
        phone: data.phone,
        email: data.email,
        isActive: data.isActive !== undefined ? data.isActive : true, // Default to active
      },
    });
    return company;
  }

  async findById(id: string): Promise<Company | null> {
    const company = await this.prisma.company.findUnique({
      where: {
        id,
      },
    });
    return company;
  }

  async findByDocument(document: string): Promise<Company | null> {
    const company = await this.prisma.company.findUnique({
      where: {
        document,
      },
    });
    return company;
  }

  async findMany(): Promise<Company[]> {
    const companies = await this.prisma.company.findMany();
    return companies;
  }

  async update(data: UpdateCompanyDTO): Promise<Company> {
    const company = await this.prisma.company.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        document: data.document,
        address: data.address,
        phone: data.phone,
        email: data.email,
        isActive: data.isActive,
      },
    });
    return company;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.company.delete({
      where: {
        id,
      },
    });
  }
}
