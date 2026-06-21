// apps/api/src/modules/vehicles/controllers/UpdateVehicleController.ts

import { Request, Response } from 'express';
import { UpdateVehicleService } from '../services/UpdateVehicleService';

export class UpdateVehicleController {
  constructor(private updateVehicleService: UpdateVehicleService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const { brand, model, year, licensePlate, color, clientId } = request.body;
    const { companyId } = request;

    const vehicle = await this.updateVehicleService.execute({
      id,
      companyId,
      brand,
      model,
      year,
      licensePlate,
      color,
      clientId,
    } as any);

    return response.json(vehicle);
  }
}
