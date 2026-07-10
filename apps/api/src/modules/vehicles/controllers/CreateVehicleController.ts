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
      plate: data.plate,
      clientId: data.clientId,
    };
    const vehicle = await container.useCases.fleet.registerVehicle.execute(payload);

    return response.status(201).json({
      success: true,
      data: vehicle,
      message: 'Vehicle created successfully'
    });
  }
}
