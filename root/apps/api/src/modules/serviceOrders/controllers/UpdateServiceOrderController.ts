// apps/api/src/modules/serviceOrders/controllers/UpdateServiceOrderController.ts

import { Request, Response } from 'express';
import { AppError } from '../../../shared/errors/AppError';
import { UpdateServiceOrderService } from '../services/UpdateServiceOrderService';

export class UpdateServiceOrderController {
  constructor(private updateServiceOrderService: UpdateServiceOrderService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const { companyId, clientId, vehicleId, description, status, startDate, endDate, totalValue } = request.body;

    try {
      const serviceOrder = await this.updateServiceOrderService.execute({
        id,
        companyId,
        clientId,
        vehicleId,
        description,
        status,
        startDate,
        endDate,
        totalValue,
      });

      return response.status(200).json(serviceOrder);
    } catch (error) {
      if (error instanceof AppError) {
        return response.status(error.statusCode).json({ message: error.message });
      }
      return response.status(500).json({ message: 'Internal server error' });
    }
  }
}
