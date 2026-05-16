// apps/api/src/modules/vehicles/controllers/ListVehicleController.ts

import { Request, Response } from 'express';
import { ListVehicleService } from '../services/ListVehicleService';

export class ListVehicleController {
  constructor(private listVehicleService: ListVehicleService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { companyId } = request;

    const vehicles = await this.listVehicleService.execute(companyId);

    return response.json(vehicles);
  }
}
