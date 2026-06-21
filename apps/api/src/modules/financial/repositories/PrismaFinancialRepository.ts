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

  async create(data: CreateFinancialDTO & { branchId?: string }): Promise<Financial> {
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

    // Map DTO INCOME/EXPENSE to schema RECEIVABLE/PAYABLE
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
    });
  }

  async findById(id: string, companyId: string): Promise<Financial | null> {
    return await this.prisma.financialRecord.findUnique({
      where: {
        id_companyId: {
          id,
          companyId,
        },
      },
    });
  }

  async findManyByCompany(companyId: string): Promise<Financial[]> {
    return await this.prisma.financialRecord.findMany({
      where: {
        companyId,
      },
    });
  }

  async update(data: UpdateFinancialDTO & { branchId?: string }): Promise<Financial> {
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
    });
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
