// apps/api/src/modules/vehicles/repositories/PrismaVehicleRepository.ts

import { PrismaClient } from '@prisma/client';
import { IVehicleRepository, Vehicle } from './IVehicleRepository';
import { CreateVehicleDTO, UpdateVehicleDTO } from '../dtos';
import { prismaClient } from '../../../shared/database/prismaClient';

export class PrismaVehicleRepository implements IVehicleRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prismaClient;
  }

  async create(data: CreateVehicleDTO): Promise<Vehicle> {
    const vehicle = await this.prisma.vehicle.create({
      data: {
        companyId: data.companyId,
        brand: data.brand,
        model: data.model,
        year: data.year,
        plate: data.plate,
        color: data.color,
        clientId: data.clientId,
      },
    });
    return vehicle;
  }

  async findById(id: string, companyId: string): Promise<Vehicle | null> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
    });
    return vehicle;
  }

  async findByPlate(plate: string, companyId: string): Promise<Vehicle | null> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        plate,
        companyId,
        deletedAt: null,
      },
    });
    return vehicle;
  }

  async findManyByCompany(companyId: string): Promise<Vehicle[]> {
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        companyId,
        deletedAt: null,
      },
    });
    return vehicles;
  }

  async findManyByClient(clientId: string, companyId: string): Promise<Vehicle[]> {
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        clientId,
        companyId,
        deletedAt: null,
      },
    });
    return vehicles;
  }

  async update(data: UpdateVehicleDTO): Promise<Vehicle> {
    const vehicle = await this.prisma.vehicle.update({
      where: {
        id: data.id,
        companyId: data.companyId,
      },
      data: {
        brand: data.brand,
        model: data.model,
        year: data.year,
        plate: data.plate,
        color: data.color,
        clientId: data.clientId,
      },
    });
    return vehicle;
  }

  async delete(id: string, companyId: string): Promise<void> {
    await this.prisma.vehicle.update({
      where: {
        id,
        companyId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
