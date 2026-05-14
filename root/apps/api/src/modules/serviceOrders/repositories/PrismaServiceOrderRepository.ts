// apps/api/src/modules/serviceOrders/repositories/PrismaServiceOrderRepository.ts

import { PrismaClient } from '@prisma/client';
import { IServiceOrderRepository, ServiceOrder } from './IServiceOrderRepository';
import { CreateServiceOrderDTO, UpdateServiceOrderDTO } from '../dtos';
import { prismaClient } from '../../../shared/database/prismaClient';

export class PrismaServiceOrderRepository implements IServiceOrderRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prismaClient;
  }

  async create(data: CreateServiceOrderDTO): Promise<ServiceOrder> {
    const serviceOrder = await this.prisma.serviceOrder.create({
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
    }) as unknown as ServiceOrder;
    return serviceOrder;
  }

  async findById(id: string, companyId: string): Promise<ServiceOrder | null> {
    const serviceOrder = await this.prisma.serviceOrder.findUnique({
      where: {
        id_companyId: {
          id,
          companyId,
        },
      },
    }) as unknown as ServiceOrder;
    return serviceOrder;
  }

  async findManyByCompany(companyId: string): Promise<ServiceOrder[]> {
    const serviceOrders = await this.prisma.serviceOrder.findMany({
      where: {
        companyId,
      },
    }) as unknown as ServiceOrder[];
    return serviceOrders;
  }

  async findManyByClient(clientId: string, companyId: string): Promise<ServiceOrder[]> {
    const serviceOrders = await this.prisma.serviceOrder.findMany({
      where: {
        clientId,
        companyId,
      },
    }) as unknown as ServiceOrder[];
    return serviceOrders;
  }

  async findManyByVehicle(vehicleId: string, companyId: string): Promise<ServiceOrder[]> {
    const serviceOrders = await this.prisma.serviceOrder.findMany({
      where: {
        vehicleId,
        companyId,
      },
    }) as unknown as ServiceOrder[];
    return serviceOrders;
  }

  async update(data: UpdateServiceOrderDTO): Promise<ServiceOrder> {
    const serviceOrder = await this.prisma.serviceOrder.update({
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
    }) as unknown as ServiceOrder;
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
