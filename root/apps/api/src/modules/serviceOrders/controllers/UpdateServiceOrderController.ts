// apps/api/src/modules/serviceOrders/controllers/UpdateServiceOrderController.ts

import { Request, Response } from 'express';
import { UpdateServiceOrderService } from '../services/UpdateServiceOrderService';

export class UpdateServiceOrderController {
  constructor(private updateServiceOrderService: UpdateServiceOrderService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const { clientId, vehicleId, description, status, startDate, endDate, totalValue } = request.body;
    const { companyId } = request;

    const serviceOrder = await this.updateServiceOrderService.execute({
      id,
      companyId,
      clientId,
      vehicleId,
      description,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      totalValue,
    });

    return response.json(serviceOrder);
  }
}
