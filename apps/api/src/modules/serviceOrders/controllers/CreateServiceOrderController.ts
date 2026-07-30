// apps/api/src/modules/serviceOrders/controllers/CreateServiceOrderController.ts

import { Request, Response } from 'express';
import { CreateServiceOrderService } from '../services/CreateServiceOrderService';

export class CreateServiceOrderController {
  constructor(private createServiceOrderService: CreateServiceOrderService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { clientId, vehicleId, description, status, startDate, endDate, totalValue } = request.body;
    const { companyId } = request;

    const serviceOrder = await this.createServiceOrderService.execute({
      companyId,
      clientId,
      vehicleId,
      description,
      status,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      totalValue,
    } as any);

    return response.status(201).json(serviceOrder);
  }
}
