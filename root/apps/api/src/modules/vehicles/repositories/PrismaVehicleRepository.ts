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
        licensePlate: data.licensePlate,
        color: data.color,
        clientId: data.clientId,
      },
    });
    return vehicle;
  }

  async findById(id: string, companyId: string): Promise<Vehicle | null> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: {
        id_companyId: {
          id,
          companyId,
        },
      },
    });
    return vehicle;
  }

  async findByLicensePlate(licensePlate: string, companyId: string): Promise<Vehicle | null> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        licensePlate,
        companyId,
      },
    });
    return vehicle;
  }

  async findManyByCompany(companyId: string): Promise<Vehicle[]> {
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        companyId,
      },
    });
    return vehicles;
  }

  async update(data: UpdateVehicleDTO): Promise<Vehicle> {
    const vehicle = await this.prisma.vehicle.update({
      where: {
        id_companyId: {
          id: data.id,
          companyId: data.companyId,
        },
      },
      data: {
        brand: data.brand,
        model: data.model,
        year: data.year,
        licensePlate: data.licensePlate,
        color: data.color,
        clientId: data.clientId,
      },
    });
    return vehicle;
  }

  async delete(id: string, companyId: string): Promise<void> {
    await this.prisma.vehicle.delete({
      where: {
        id_companyId: {
          id,
          companyId,
        },
      },
    });
  }
}
