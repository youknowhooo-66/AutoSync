// apps/api/src/modules/vehicles/controllers/ListVehicleController.ts

import { Request, Response } from 'express';
import { AppError } from '../../../shared/errors/AppError';
import { ListVehicleService } from '../services/ListVehicleService';

export class ListVehicleController {
  constructor(private listVehicleService: ListVehicleService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { companyId } = request.query; // Assuming companyId comes from query params or context

    try {
      if (typeof companyId !== 'string') {
        throw new AppError('Company ID must be a string.', 400);
      }
      const vehicles = await this.listVehicleService.execute(companyId);

      return response.status(200).json(vehicles);
    } catch (error) {
      if (error instanceof AppError) {
        return response.status(error.statusCode).json({ message: error.message });
      }
      return response.status(500).json({ message: 'Internal server error' });
    }
  }
}
