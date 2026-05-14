// apps/api/src/modules/vehicles/controllers/UpdateVehicleController.ts

import { Request, Response } from 'express';
import { AppError } from '../../../shared/errors/AppError';
import { UpdateVehicleService } from '../services/UpdateVehicleService';

export class UpdateVehicleController {
  constructor(private updateVehicleService: UpdateVehicleService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const { companyId, brand, model, year, licensePlate, color, clientId } = request.body;

    try {
      const vehicle = await this.updateVehicleService.execute({
        id,
        companyId,
        brand,
        model,
        year,
        licensePlate,
        color,
        clientId,
      });

      return response.status(200).json(vehicle);
    } catch (error) {
      if (error instanceof AppError) {
        return response.status(error.statusCode).json({ message: error.message });
      }
      return response.status(500).json({ message: 'Internal server error' });
    }
  }
}
