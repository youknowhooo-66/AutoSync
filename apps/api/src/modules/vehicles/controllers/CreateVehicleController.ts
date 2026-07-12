// apps/api/src/modules/vehicles/controllers/CreateVehicleController.ts

import { Request, Response } from 'express';
import { createVehicleSchema } from '../validators/createSchema';
import { container } from '../../../container';

export class CreateVehicleController {
  constructor() {}

  async handle(request: Request, response: Response): Promise<Response> {
    const data = createVehicleSchema.parse(request.body);
    const { companyId } = request.user;

    const payload = {
      companyId,
      clientId: data.clientId,
      plate: data.plate,
      brand: data.brand,
      model: data.model,
      year: data.year,
      color: data.color,
      chassis: data.chassis,
      mileage: data.mileage,
      engine: data.engine,
    };
    const vehicle = await container.useCases.fleet.registerVehicle.execute(payload);

    return response.status(201).json({
      success: true,
      data: vehicle,
      message: 'Vehicle created successfully'
    });
  }
}
