// apps/api/src/modules/vehicles/services/CreateVehicleService.ts

import { IVehicleRepository, Vehicle } from '../repositories/IVehicleRepository';
import { CreateVehicleDTO } from '../dtos';
import { AppError } from '../../../shared/errors/AppError';
import { prismaClient } from '../../../shared/database/prismaClient';

export class CreateVehicleService {
  constructor(private vehicleRepository: IVehicleRepository) {}

  async execute(data: CreateVehicleDTO): Promise<Vehicle> {
    const { companyId, plate, clientId } = data;

    if (!companyId) {
      throw new AppError('Company ID is required.');
    }

    // Secure multi-tenant relationship isolation
    const client = await prismaClient.client.findFirst({
      where: {
        id: clientId,
        companyId,
      },
    });

    if (!client) {
      throw new AppError('Client not found or belongs to another tenant.', 404);
    }

    const vehicleExists = await this.vehicleRepository.findByPlate(plate, companyId);

    if (vehicleExists) {
      throw new AppError('Vehicle with this license plate already exists for this company.', 409);
    }

    const vehicle = await this.vehicleRepository.create(data);

    return vehicle;
  }
}
