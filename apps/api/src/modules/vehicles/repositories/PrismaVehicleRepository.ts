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
    const vehicle = await this.prisma.vehicle.create({
      data: {
        companyId: data.companyId,
        brand: data.brand,
        model: data.model,
        year: data.year,
        plate: data.plate,
        color: data.color,
        clientId: data.clientId,
        chassis: data.chassis,
        mileage: data.mileage,
        engine: data.engine,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    } as any);
    return vehicle;
  }

  async findById(id: string, companyId: string): Promise<Vehicle | null> {
    const vehicle = await this.prisma.vehicle.findFirst(({
          where: {
            id,
            companyId,
            
          },
          include: {
            client: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        } as unknown as Parameters<typeof this.prisma.vehicle.findFirst>[0]));
    if (!vehicle) return null;
    return vehicle;
  }

  async findByPlate(plate: string, companyId: string): Promise<Vehicle | null> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        plate,
        companyId,
        },
    });
    if (!vehicle) return null;
    return vehicle;
  }

  async findManyByCompany(companyId: string): Promise<Vehicle[]> {
    const vehicles = await this.prisma.vehicle.findMany(({
          where: {
            companyId,
            },
          include: {
            client: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        } as unknown as Parameters<typeof this.prisma.vehicle.findMany>[0]));
    return vehicles;
  }

  async findManyByClient(clientId: string, companyId: string): Promise<Vehicle[]> {
    const vehicles = await this.prisma.vehicle.findMany(({
          where: {
            clientId,
            companyId,
            },
          include: {
            client: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        } as unknown as Parameters<typeof this.prisma.vehicle.findMany>[0]));
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
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    } as any);
    return vehicle;
  }

  async delete(id: string, companyId: string): Promise<void> {
    await this.prisma.vehicle.delete(({
          where: {
            id,
            companyId,
          },
        } as any));
  }
}

export { PrismaClient } from "@prisma/client";
