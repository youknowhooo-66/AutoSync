// apps/api/src/modules/stock/repositories/PrismaStockRepository.ts
import { IStockRepository, Stock } from './IStockRepository';
import { CreateStockDTO, UpdateStockDTO } from '../dtos';
import { prismaClient } from '../../../shared/database/prismaClient';
import { PrismaClient } from "@prisma/client";

export class PrismaStockRepository implements IStockRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prismaClient;
  }

  async create(data: CreateStockDTO): Promise<Stock> {
    const stock = await this.prisma.stock.create({
      data: {
        companyId: data.companyId,
        partId: data.productId,
        branchId: (data as any).branchId || '', // branchId is required in schema but missing in DTO?
        quantity: data.quantity,
      },
    }) as unknown as Stock;
    return stock;
  }

  async findById(id: string, companyId: string): Promise<Stock | null> {
    const stock = await this.prisma.stock.findFirst({
      where: {
        id: id,
        companyId: companyId,
      },
    }) as unknown as Stock;
    return stock;
  }

  async findByProduct(partId: string, companyId: string): Promise<Stock | null> {
    const stock = await this.prisma.stock.findFirst({
      where: {
        partId: partId,
        companyId: companyId,
      },
    }) as unknown as Stock;
    return stock;
  }

  async findManyByCompany(companyId: string): Promise<Stock[]> {
    const stocks = await this.prisma.stock.findMany({
      where: {
        companyId,
      },
    }) as unknown as Stock[];
    return stocks;
  }

  async update(data: UpdateStockDTO): Promise<Stock> {
    const stock = await this.prisma.stock.update({
      where: {
        id: data.id,
      },
      data: {
        partId: data.productId,
        quantity: data.quantity,
      },
    }) as unknown as Stock;
    return stock;
  }

  async delete(id: string, companyId: string): Promise<void> {
    await this.prisma.stock.deleteMany({
      where: {
        id: id,
        companyId: companyId,
      },
    });
  }
}

export { PrismaClient } from "@prisma/client";
