// apps/api/src/modules/vehicles/services/UpdateVehicleService.ts

import { IVehicleRepository, Vehicle } from '../repositories/IVehicleRepository';
import { UpdateVehicleDTO } from '../dtos';
import { AppError } from '../../../shared/errors/AppError';

export class UpdateVehicleService {
  constructor(private vehicleRepository: IVehicleRepository) {}

  async execute({ id, companyId, brand, model, year, licensePlate, color, clientId }: UpdateVehicleDTO): Promise<Vehicle> {
    if (!id || !companyId) {
      throw new AppError('Vehicle ID and Company ID are required.');
    }

    const vehicle = await this.vehicleRepository.findById(id, companyId);

    if (!vehicle) {
      throw new AppError('Vehicle not found.', 404);
    }

    if (licensePlate && licensePlate !== vehicle.licensePlate) {
      const vehicleExists = await this.vehicleRepository.findByLicensePlate(licensePlate, companyId);
      if (vehicleExists && vehicleExists.id !== id) {
        throw new AppError('Vehicle with this license plate already exists for this company.', 409);
      }
    }

    const updatedVehicle = await this.vehicleRepository.update({
      id,
      companyId,
      brand: brand || vehicle.brand,
      model: model || vehicle.model,
      year: year || vehicle.year,
      licensePlate: licensePlate || vehicle.licensePlate,
      color: color || vehicle.color,
      clientId: clientId || vehicle.clientId,
    });

    return updatedVehicle;
  }
}
