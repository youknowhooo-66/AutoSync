// apps/api/src/modules/serviceOrders/repositories/PrismaServiceOrderRepository.ts
import { IServiceOrderRepository, ServiceOrder } from './IServiceOrderRepository';
import { CreateServiceOrderDTO, UpdateServiceOrderDTO } from '../dtos';
import { prismaClient } from '../../../shared/database/prismaClient';
import { PrismaClient } from "@prisma/client";

export class PrismaServiceOrderRepository implements IServiceOrderRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prismaClient;
  }

  async create(data: CreateServiceOrderDTO): Promise<ServiceOrder> {
    const serviceOrder = await this.prisma.serviceOrder.create(({
          data: {
            companyId: data.companyId,
            clientId: data.clientId,
            vehicleId: data.vehicleId,
            description: data.description,
            status: data.status,
            startDate: data.startDate,
            endDate: data.endDate,
            totalValue: data.totalValue,
          },
        } as unknown as Parameters<typeof this.prisma.serviceOrder.create>[0])) as unknown as ServiceOrder;
    return serviceOrder;
  }

  async findById(id: string, companyId: string) {
    return await this.prisma.serviceOrder.findFirst(({
          where: { id, companyId, deletedAt: null },
          include: {
            parts: { include: { part: true } },
            services: true,
            client: true,
            vehicle: true,
          },
        } as unknown as Parameters<typeof this.prisma.serviceOrder.findFirst>[0]));
  }

  async findByNumber(number: number, companyId: string) {
    return await this.prisma.serviceOrder.findFirst(({
          where: { number, companyId, deletedAt: null },
        } as unknown as Parameters<typeof this.prisma.serviceOrder.findFirst>[0]));
  }

  async list(companyId: string, filters: any) {
    return await this.prisma.serviceOrder.findMany(({
          where: {
            companyId,
            deletedAt: null,
            ...filters,
          },
          include: {
            client: true,
            vehicle: true,
          },
          orderBy: { createdAt: 'desc' },
        } as unknown as Parameters<typeof this.prisma.serviceOrder.findMany>[0]));
  }

  async findManyByCompany(companyId: string): Promise<ServiceOrder[]> {
    const serviceOrders = await this.prisma.serviceOrder.findMany(({
          where: {
            companyId,
          },
        } as unknown as Parameters<typeof this.prisma.serviceOrder.findMany>[0])) as unknown as ServiceOrder[];
    return serviceOrders;
  }

  async findManyByClient(clientId: string, companyId: string): Promise<ServiceOrder[]> {
    const serviceOrders = await this.prisma.serviceOrder.findMany(({
          where: {
            clientId,
            companyId,
          },
        } as unknown as Parameters<typeof this.prisma.serviceOrder.findMany>[0])) as unknown as ServiceOrder[];
    return serviceOrders;
  }

  async findManyByVehicle(vehicleId: string, companyId: string): Promise<ServiceOrder[]> {
    const serviceOrders = await this.prisma.serviceOrder.findMany(({
          where: {
            vehicleId,
            companyId,
          },
        } as unknown as Parameters<typeof this.prisma.serviceOrder.findMany>[0])) as unknown as ServiceOrder[];
    return serviceOrders;
  }

  async update(data: UpdateServiceOrderDTO): Promise<ServiceOrder> {
    const serviceOrder = await this.prisma.serviceOrder.update(({
          where: {
            id_companyId: {
              id: data.id,
              companyId: data.companyId,
            },
          },
          data: {
            clientId: data.clientId,
            vehicleId: data.vehicleId,
            description: data.description,
            status: data.status,
            startDate: data.startDate,
            endDate: data.endDate,
            totalValue: data.totalValue,
          },
        } as unknown as Parameters<typeof this.prisma.serviceOrder.update>[0])) as unknown as ServiceOrder;
    return serviceOrder;
  }

  async delete(id: string, companyId: string): Promise<void> {
    await this.prisma.serviceOrder.delete({
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
