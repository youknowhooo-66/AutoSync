// apps/api/src/modules/financial/repositories/PrismaFinancialEntryRepository.ts
import { IFinancialEntryRepository, FinancialEntry } from './IFinancialEntryRepository';
import { CreateFinancialDTO, UpdateFinancialDTO } from '../dtos';
import { prismaClient } from '../../../shared/database/prismaClient';
import { PrismaClient } from "@prisma/client";

export class PrismaFinancialEntryRepository implements IFinancialEntryRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prismaClient;
  }

  async create(data: CreateFinancialDTO): Promise<FinancialEntry> {
    const financialEntry = await this.prisma.financialRecord.create(({
          data: {
            companyId: data.companyId,
            type: data.type,
            amount: data.amount,
            description: data.description,
            date: data.date,
            categoryId: data.categoryId,
          },
        } as unknown as Parameters<typeof this.prisma.financialRecord.create>[0]));
    return financialEntry;
  }

  async findById(id: string, companyId: string): Promise<FinancialEntry | null> {
    const financialEntry = await this.prisma.financialRecord.findUnique(({
          where: {
            id_companyId: {
              id,
              companyId,
            },
          },
        } as unknown as Parameters<typeof this.prisma.financialRecord.findUnique>[0]));
    return financialEntry;
  }

  async findManyByCompany(companyId: string): Promise<FinancialEntry[]> {
    const financialEntries = await this.prisma.financialRecord.findMany(({
          where: {
            companyId,
          },
        } as unknown as Parameters<typeof this.prisma.financialRecord.findMany>[0]));
    return financialEntries;
  }

  async update(data: UpdateFinancialDTO): Promise<FinancialEntry> {
    const financialEntry = await this.prisma.financialRecord.update(({
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
        } as unknown as Parameters<typeof this.prisma.financialRecord.update>[0]));
    return financialEntry;
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
