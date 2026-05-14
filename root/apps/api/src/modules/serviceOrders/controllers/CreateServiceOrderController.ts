// apps/api/src/modules/serviceOrders/controllers/CreateServiceOrderController.ts

import { Request, Response } from 'express';
import { AppError } from '../../../shared/errors/AppError';
import { CreateServiceOrderService } from '../services/CreateServiceOrderService';

export class CreateServiceOrderController {
  constructor(private createServiceOrderService: CreateServiceOrderService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { companyId, clientId, vehicleId, description, status, startDate, endDate, totalValue } = request.body;

    try {
      const serviceOrder = await this.createServiceOrderService.execute({
        companyId,
        clientId,
        vehicleId,
        description,
        status,
        startDate,
        endDate,
        totalValue,
      });

      return response.status(201).json(serviceOrder);
    } catch (error) {
      if (error instanceof AppError) {
        return response.status(error.statusCode).json({ message: error.message });
      }
      return response.status(500).json({ message: 'Internal server error' });
    }
  }
}
