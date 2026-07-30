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

  async create(data: CreateFinancialDTO & { branchId?: string }): Promise<FinancialEntry> {
    let branchId = data.branchId;
    
    if (!branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: { companyId: data.companyId },
      });
      if (!branch) {
        throw new Error('A branch is required to create a financial record.');
      }
      branchId = branch.id;
    }

    const mappedType = 
      data.type === 'EXPENSE' || (data.type as string) === 'PAYABLE' 
        ? 'PAYABLE' 
        : 'RECEIVABLE';

    return await this.prisma.financialRecord.create({
      data: {
        companyId: data.companyId,
        branchId,
        type: mappedType,
        amount: data.amount,
        description: data.description,
        category: data.categoryId || 'General',
        dueDate: data.date || new Date(),
        status: 'PENDING',
      },
    }) as any;
  }

  async findById(id: string, companyId: string): Promise<FinancialEntry | null> {
    return await this.prisma.financialRecord.findUnique({
      where: {
        id_companyId: {
          id,
          companyId,
        },
      },
    }) as any;
  }

  async findManyByCompany(companyId: string): Promise<FinancialEntry[]> {
    return await this.prisma.financialRecord.findMany({
      where: {
        companyId,
      },
    }) as any;
  }

  async update(data: UpdateFinancialDTO & { branchId?: string }): Promise<FinancialEntry> {
    const mappedType = 
      data.type === 'EXPENSE' || (data.type as string) === 'PAYABLE' 
        ? 'PAYABLE' 
        : 'RECEIVABLE';

    return await this.prisma.financialRecord.update({
      where: {
        id_companyId: {
          id: data.id,
          companyId: data.companyId,
        },
      },
      data: {
        type: mappedType,
        amount: data.amount,
        description: data.description,
        category: data.categoryId || 'General',
        dueDate: data.date || new Date(),
      },
    }) as any;
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
