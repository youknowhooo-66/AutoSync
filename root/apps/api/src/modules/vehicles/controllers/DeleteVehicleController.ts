// apps/api/src/modules/vehicles/controllers/DeleteVehicleController.ts

import { Request, Response } from 'express';
import { DeleteVehicleService } from '../services/DeleteVehicleService';

export class DeleteVehicleController {
  constructor(private deleteVehicleService: DeleteVehicleService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const { companyId } = request;

    await this.deleteVehicleService.execute(id, companyId);

    return response.status(204).send();
  }
}
