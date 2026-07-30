// apps/api/src/modules/vehicles/services/ListVehicleService.ts

import { IVehicleRepository, Vehicle } from '../repositories/IVehicleRepository';
import { AppError } from '../../../shared/errors/AppError';

export class ListVehicleService {
  constructor(private vehicleRepository: IVehicleRepository) {}

  async execute(companyId: string): Promise<Vehicle[]> {
    if (!companyId) {
      throw new AppError('Company ID is required.');
    }

    const vehicles = await this.vehicleRepository.findManyByCompany(companyId);

    return vehicles;
  }
}
