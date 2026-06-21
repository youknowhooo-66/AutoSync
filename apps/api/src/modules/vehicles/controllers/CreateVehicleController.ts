// apps/api/src/modules/vehicles/controllers/CreateVehicleController.ts

import { Request, Response } from 'express';
import { CreateVehicleService } from '../services/CreateVehicleService';
import { createVehicleSchema } from '../validators/createSchema';

export class CreateVehicleController {
  constructor(private createVehicleService: CreateVehicleService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const data = createVehicleSchema.parse(request.body);
    const { companyId } = request.user;

    const vehicle = await this.createVehicleService.execute({
      ...data,
      companyId,
    } as any);

    return response.status(201).json({
      success: true,
      data: vehicle,
      message: 'Vehicle created successfully'
    });
  }
}
