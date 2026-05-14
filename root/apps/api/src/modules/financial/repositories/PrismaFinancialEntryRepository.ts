// apps/api/src/modules/financial/repositories/PrismaFinancialEntryRepository.ts

import { PrismaClient } from '@prisma/client';
import { IFinancialEntryRepository, FinancialEntry } from './IFinancialEntryRepository';
import { CreateFinancialEntryDTO, UpdateFinancialEntryDTO } from '../dtos';
import { prismaClient } from '../../../shared/database/prismaClient';

export class PrismaFinancialEntryRepository implements IFinancialEntryRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prismaClient;
  }

  async create(data: CreateFinancialEntryDTO): Promise<FinancialEntry> {
    const financialEntry = await this.prisma.financialEntry.create({
      data: {
        companyId: data.companyId,
        type: data.type,
        amount: data.amount,
        description: data.description,
        date: data.date,
        categoryId: data.categoryId,
      },
    });
    return financialEntry;
  }

  async findById(id: string, companyId: string): Promise<FinancialEntry | null> {
    const financialEntry = await this.prisma.financialEntry.findUnique({
      where: {
        id_companyId: {
          id,
          companyId,
        },
      },
    });
    return financialEntry;
  }

  async findManyByCompany(companyId: string): Promise<FinancialEntry[]> {
    const financialEntries = await this.prisma.financialEntry.findMany({
      where: {
        companyId,
      },
    });
    return financialEntries;
  }

  async update(data: UpdateFinancialEntryDTO): Promise<FinancialEntry> {
    const financialEntry = await this.prisma.financialEntry.update({
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
    });
    return financialEntry;
  }

  async delete(id: string, companyId: string): Promise<void> {
    await this.prisma.financialEntry.delete({
      where: {
        id_companyId: {
          id,
          companyId,
        },
      },
    });
  }
}
