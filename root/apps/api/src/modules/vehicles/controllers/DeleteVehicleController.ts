// apps/api/src/modules/vehicles/controllers/DeleteVehicleController.ts

import { Request, Response } from 'express';
import { AppError } from '../../../shared/errors/AppError';
import { DeleteVehicleService } from '../services/DeleteVehicleService';

export class DeleteVehicleController {
  constructor(private deleteVehicleService: DeleteVehicleService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const { companyId } = request.body; // Assuming companyId comes from body or context

    try {
      await this.deleteVehicleService.execute(id, companyId);

      return response.status(204).send();
    } catch (error) {
      if (error instanceof AppError) {
        return response.status(error.statusCode).json({ message: error.message });
      }
      return response.status(500).json({ message: 'Internal server error' });
    }
  }
}
