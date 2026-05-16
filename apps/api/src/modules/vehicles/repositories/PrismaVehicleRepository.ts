// apps/api/src/modules/vehicles/repositories/PrismaVehicleRepository.ts
import { IVehicleRepository, Vehicle } from './IVehicleRepository';
import { CreateVehicleDTO, UpdateVehicleDTO } from '../dtos';
import { prismaClient } from '../../../shared/database/prismaClient';
import { PrismaClient } from "@prisma/client";

export class PrismaVehicleRepository implements IVehicleRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prismaClient;
  }

  async create(data: CreateVehicleDTO): Promise<Vehicle> {
    const vehicle = await this.prisma.vehicle.create(({
          data: {
            companyId: data.companyId,
            brand: data.brand,
            model: data.model,
            year: data.year,
            licensePlate: (data as any).plate || (data as any).licensePlate,
            color: data.color,
            clientId: data.clientId,
          },
        } as unknown as Parameters<typeof this.prisma.vehicle.create>[0]));
    return vehicle;
  }

  async findById(id: string, companyId: string): Promise<Vehicle | null> {
    const vehicle = await this.prisma.vehicle.findFirst(({
          where: {
            id,
            companyId,
            deletedAt: null,
          },
        } as unknown as Parameters<typeof this.prisma.vehicle.findFirst>[0]));
    if (!vehicle) return null;
    return vehicle;
  }

  async findByLicensePlate(licensePlate: string, companyId: string): Promise<Vehicle | null> {
    const vehicle = await this.prisma.vehicle.findFirst(({
          where: {
            plate: licensePlate,
            companyId,
            deletedAt: null,
          },
        } as unknown as Parameters<typeof this.prisma.vehicle.findFirst>[0]));
    if (!vehicle) return null;
    return vehicle;
  }

  async findManyByCompany(companyId: string): Promise<Vehicle[]> {
    const vehicles = await this.prisma.vehicle.findMany(({
          where: {
            companyId,
            deletedAt: null,
          },
        } as unknown as Parameters<typeof this.prisma.vehicle.findMany>[0]));
    return vehicles;
  }

  async findManyByClient(clientId: string, companyId: string): Promise<Vehicle[]> {
    const vehicles = await this.prisma.vehicle.findMany(({
          where: {
            clientId,
            companyId,
            deletedAt: null,
          },
        } as unknown as Parameters<typeof this.prisma.vehicle.findMany>[0]));
    return vehicles;
  }

  async update(data: UpdateVehicleDTO): Promise<Vehicle> {
    const vehicle = await this.prisma.vehicle.update(({
          where: {
            id: data.id,
            companyId: data.companyId,
          },
          data: {
            brand: data.brand,
            model: data.model,
            year: data.year,
            plate: (data as any).plate || (data as any).licensePlate,
            color: data.color,
            clientId: data.clientId,
          },
        } as unknown as Parameters<typeof this.prisma.vehicle.update>[0]));
    return vehicle;
  }

  async delete(id: string, companyId: string): Promise<void> {
    await this.prisma.vehicle.update(({
          where: {
            id,
            companyId,
          },
          data: {
            deletedAt: new Date(),
          },
        } as unknown as Parameters<typeof this.prisma.vehicle.update>[0]));
  }
}

export { PrismaClient } from "@prisma/client";
