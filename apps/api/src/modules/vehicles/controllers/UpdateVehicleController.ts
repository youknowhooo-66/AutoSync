// apps/api/src/modules/vehicles/controllers/UpdateVehicleController.ts

import { Request, Response } from 'express';
import { container } from '../../../container';

export class UpdateVehicleController {
  constructor() {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const { brand, model, year, licensePlate, color, clientId } = request.body;
    const { companyId } = request;

    const payload = {
      vehicleId: id,
      companyId,
      plate: licensePlate || '',
    };
    const vehicle = await container.useCases.fleet.updateVehicle.execute(payload);

    return response.json(vehicle);
  }
}
