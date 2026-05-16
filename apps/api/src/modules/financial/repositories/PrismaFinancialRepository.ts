// apps/api/src/modules/financial/repositories/PrismaFinancialRepository.ts
import { IFinancialRepository, Financial } from './IFinancialRepository';
import { CreateFinancialDTO, UpdateFinancialDTO } from '../dtos';
import { prismaClient } from '../../../shared/database/prismaClient';
import { PrismaClient } from "@prisma/client";

export class PrismaFinancialRepository implements IFinancialRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prismaClient;
  }

  async create(data: CreateFinancialDTO): Promise<Financial> {
    const financial = await this.prisma.financialRecord.create(({
          data: {
            companyId: data.companyId,
            type: data.type,
            amount: data.amount,
            description: data.description,
            date: data.date,
            categoryId: data.categoryId,
          },
        } as unknown as Parameters<typeof this.prisma.financialRecord.create>[0])) as unknown as Financial;
    return financial;
  }

  async findById(id: string, companyId: string): Promise<Financial | null> {
    const financial = await this.prisma.financialRecord.findUnique(({
          where: {
            id_companyId: {
              id,
              companyId,
            },
          },
        } as unknown as Parameters<typeof this.prisma.financialRecord.findUnique>[0])) as unknown as Financial;
    return financial;
  }

  async findManyByCompany(companyId: string): Promise<Financial[]> {
    const financials = await this.prisma.financialRecord.findMany(({
          where: {
            companyId,
          },
        } as unknown as Parameters<typeof this.prisma.financialRecord.findMany>[0])) as unknown as Financial[];
    return financials;
  }

  async update(data: UpdateFinancialDTO): Promise<Financial> {
    const financial = await this.prisma.financialRecord.update(({
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
        } as unknown as Parameters<typeof this.prisma.financialRecord.update>[0])) as unknown as Financial;
    return financial;
  }

  async delete(id: string, companyId: string): Promise<void> {
    await this.prisma.financialRecord.delete({
      where: {
        id_companyId: {
          id,
          companyId,
        },
      },
    });
  }
}

export { PrismaClient } from "@prisma/client";
