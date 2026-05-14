// apps/api/src/modules/stock/repositories/PrismaStockRepository.ts

import { PrismaClient } from '@prisma/client';
import { IStockRepository, Stock } from './IStockRepository';
import { CreateStockDTO, UpdateStockDTO } from '../dtos';
import { prismaClient } from '../../../shared/database/prismaClient';

export class PrismaStockRepository implements IStockRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prismaClient;
  }

  async create(data: CreateStockDTO): Promise<Stock> {
    const stock = await this.prisma.stock.create({
      data: {
        companyId: data.companyId,
        productId: data.productId,
        quantity: data.quantity,
        location: data.location,
        minimumStock: data.minimumStock,
      },
    });
    return stock;
  }

  async findById(id: string, companyId: string): Promise<Stock | null> {
    const stock = await this.prisma.stock.findUnique({
      where: {
        id_companyId: {
          id,
          companyId,
        },
      },
    });
    return stock;
  }

  async findByProductId(productId: string, companyId: string): Promise<Stock | null> {
    const stock = await this.prisma.stock.findFirst({
      where: {
        productId,
        companyId,
      },
    });
    return stock;
  }

  async findManyByCompany(companyId: string): Promise<Stock[]> {
    const stock = await this.prisma.stock.findMany({
      where: {
        companyId,
      },
    });
    return stock;
  }

  async update(data: UpdateStockDTO): Promise<Stock> {
    const stock = await this.prisma.stock.update({
      where: {
        id_companyId: {
          id: data.id,
          companyId: data.companyId,
        },
      },
      data: {
        productId: data.productId,
        quantity: data.quantity,
        location: data.location,
        minimumStock: data.minimumStock,
      },
    });
    return stock;
  }

  async delete(id: string, companyId: string): Promise<void> {
    await this.prisma.stock.delete({
      where: {
        id_companyId: {
          id,
          companyId,
        },
      },
    });
  }
}
