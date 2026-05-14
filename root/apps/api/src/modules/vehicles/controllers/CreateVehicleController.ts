// apps/api/src/modules/vehicles/controllers/CreateVehicleController.ts

import { Request, Response } from 'express';
import { AppError } from '../../../shared/errors/AppError';
import { CreateVehicleService } from '../services/CreateVehicleService';

export class CreateVehicleController {
  constructor(private createVehicleService: CreateVehicleService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { companyId, brand, model, year, licensePlate, color, clientId } = request.body;

    try {
      const vehicle = await this.createVehicleService.execute({
        companyId,
        brand,
        model,
        year,
        licensePlate,
        color,
        clientId,
      });

      return response.status(201).json(vehicle);
    } catch (error) {
      if (error instanceof AppError) {
        return response.status(error.statusCode).json({ message: error.message });
      }
      return response.status(500).json({ message: 'Internal server error' });
    }
  }
}
