// apps/api/src/modules/financial/repositories/PrismaFinancialRepository.ts

import { PrismaClient } from '@prisma/client';
import { IFinancialRepository, Financial } from './IFinancialRepository';
import { CreateFinancialDTO, UpdateFinancialDTO } from '../dtos';
import { prismaClient } from '../../../shared/database/prismaClient';

export class PrismaFinancialRepository implements IFinancialRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prismaClient;
  }

  async create(data: CreateFinancialDTO): Promise<Financial> {
    const financial = await this.prisma.financial.create({
      data: {
        companyId: data.companyId,
        type: data.type,
        amount: data.amount,
        description: data.description,
        date: data.date,
        categoryId: data.categoryId,
      },
    }) as unknown as Financial;
    return financial;
  }

  async findById(id: string, companyId: string): Promise<Financial | null> {
    const financial = await this.prisma.financial.findUnique({
      where: {
        id_companyId: {
          id,
          companyId,
        },
      },
    }) as unknown as Financial;
    return financial;
  }

  async findManyByCompany(companyId: string): Promise<Financial[]> {
    const financials = await this.prisma.financial.findMany({
      where: {
        companyId,
      },
    }) as unknown as Financial[];
    return financials;
  }

  async update(data: UpdateFinancialDTO): Promise<Financial> {
    const financial = await this.prisma.financial.update({
      where: {
        id_companyId: {
          id: data.id,
          companyId: data.companyId,
        },
      },
      data: {
        type: data.type,
        amount: data.amount,
        description: data.description,
        date: data.date,
        categoryId: data.categoryId,
      },
    }) as unknown as Financial;
    return financial;
  }

  async delete(id: string, companyId: string): Promise<void> {
    await this.prisma.financial.delete({
      where: {
        id_companyId: {
          id,
          companyId,
        },
      },
    });
  }
}
