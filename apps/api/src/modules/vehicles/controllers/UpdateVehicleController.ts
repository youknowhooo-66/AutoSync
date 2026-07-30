import { Request, Response } from 'express';
import { updateVehicleSchema } from '../validators/updateSchema';
import { container } from '../../../container';

export class UpdateVehicleController {
  constructor() {}

  async handle(request: Request, response: Response): Promise<Response> {
    const data = updateVehicleSchema.parse({
      ...request.body,
      id: request.params.id,
    });
    const { companyId } = request.user;

    const payload = {
      vehicleId: data.id,
      companyId: String(companyId),
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
    const vehicle = await container.useCases.fleet.updateVehicle.execute(payload);

    return response.json(vehicle);
  }
}
