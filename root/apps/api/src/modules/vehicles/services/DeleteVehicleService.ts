// apps/api/src/modules/vehicles/services/DeleteVehicleService.ts

import { IVehicleRepository } from '../repositories/IVehicleRepository';
import { AppError } from '../../../shared/errors/AppError';

export class DeleteVehicleService {
  constructor(private vehicleRepository: IVehicleRepository) {}

  async execute(id: string, companyId: string): Promise<void> {
    if (!id || !companyId) {
      throw new AppError('Vehicle ID and Company ID are required.');
    }

    const vehicle = await this.vehicleRepository.findById(id, companyId);

    if (!vehicle) {
      throw new AppError('Vehicle not found.', 404);
    }

    await this.vehicleRepository.delete(id, companyId);
  }
}
