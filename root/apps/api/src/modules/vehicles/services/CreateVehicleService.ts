// apps/api/src/modules/vehicles/services/CreateVehicleService.ts

import { IVehicleRepository, Vehicle } from '../repositories/IVehicleRepository';
import { CreateVehicleDTO } from '../dtos';
import { AppError } from '../../../shared/errors/AppError';

export class CreateVehicleService {
  constructor(private vehicleRepository: IVehicleRepository) {}

  async execute({ companyId, brand, model, year, licensePlate, color, clientId }: CreateVehicleDTO): Promise<Vehicle> {
    if (!companyId) {
      throw new AppError('Company ID is required.');
    }

    const vehicleExists = await this.vehicleRepository.findByLicensePlate(licensePlate, companyId);

    if (vehicleExists) {
      throw new AppError('Vehicle with this license plate already exists for this company.', 409);
    }

    const vehicle = await this.vehicleRepository.create({
      companyId,
      brand,
      model,
      year,
      licensePlate,
      color,
      clientId,
    });

    return vehicle;
  }
}
