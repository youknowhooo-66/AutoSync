// apps/api/src/modules/vehicles/services/UpdateVehicleService.ts

import { IVehicleRepository, Vehicle } from '../repositories/IVehicleRepository';
import { UpdateVehicleDTO } from '../dtos';
import { AppError } from '../../../shared/errors/AppError';
import { prismaClient } from '../../../shared/database/prismaClient';

export class UpdateVehicleService {
  constructor(private vehicleRepository: IVehicleRepository) {}

  async execute(data: UpdateVehicleDTO): Promise<Vehicle> {
    const { id, companyId, clientId } = data;

    const vehicleExists = await this.vehicleRepository.findById(id, companyId);

    if (!vehicleExists) {
      throw new AppError('Vehicle not found.', 404);
    }

    if (clientId) {
      // Secure multi-tenant relationship isolation during update
      const client = await prismaClient.client.findFirst({
        where: {
          id: clientId,
          companyId,
        },
      });

      if (!client) {
        throw new AppError('Client not found or belongs to another tenant.', 404);
      }
    }

    const vehicle = await this.vehicleRepository.update(data);

    return vehicle;
  }
}
