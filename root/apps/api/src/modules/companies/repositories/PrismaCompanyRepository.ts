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
        isActive: data.isActive ?? true,
      },
    });
    return company as Company;
  }

  async findById(id: string): Promise<Company | null> {
    const company = await this.prisma.company.findFirst({
      where: { 
        id,
        deletedAt: null,
      },
    });
    return company as Company | null;
  }

  async findByDocument(document: string): Promise<Company | null> {
    const company = await this.prisma.company.findFirst({
      where: { 
        document,
        deletedAt: null,
      },
    });
    return company as Company | null;
  }

  async findMany(): Promise<Company[]> {
    const companies = await this.prisma.company.findMany({
      where: {
        deletedAt: null,
      },
    });
    return companies as Company[];
  }

  async update(data: UpdateCompanyDTO): Promise<Company> {
    const company = await this.prisma.company.update({
      where: { id: data.id },
      data: {
        name: data.name,
        document: data.document,
        address: data.address,
        phone: data.phone,
        email: data.email,
        isActive: data.isActive,
      },
    });
    return company as Company;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.company.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
