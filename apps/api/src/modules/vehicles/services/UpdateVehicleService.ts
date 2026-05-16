// apps/api/src/modules/vehicles/services/UpdateVehicleService.ts

import { IVehicleRepository, Vehicle } from '../repositories/IVehicleRepository';
import { UpdateVehicleDTO } from '../dtos';
import { AppError } from '../../../shared/errors/AppError';

export class UpdateVehicleService {
  constructor(private vehicleRepository: IVehicleRepository) {}

  async execute(data: UpdateVehicleDTO): Promise<Vehicle> {
    const { id, companyId } = data;

    const vehicleExists = await this.vehicleRepository.findById(id, companyId);

    if (!vehicleExists) {
      throw new AppError('Vehicle not found.', 404);
    }

    const vehicle = await this.vehicleRepository.update(data);

    return vehicle;
  }
}
