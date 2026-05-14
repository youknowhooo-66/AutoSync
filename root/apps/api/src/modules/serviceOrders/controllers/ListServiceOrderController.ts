// apps/api/src/modules/serviceOrders/controllers/ListServiceOrderController.ts

import { Request, Response } from 'express';
import { AppError } from '../../../shared/errors/AppError';
import { ListServiceOrderService } from '../services/ListServiceOrderService';

export class ListServiceOrderController {
  constructor(private listServiceOrderService: ListServiceOrderService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { companyId } = request.query; // Assuming companyId comes from query params or context

    try {
      if (typeof companyId !== 'string') {
        throw new AppError('Company ID must be a string.', 400);
      }
      const serviceOrders = await this.listServiceOrderService.execute(companyId);

      return response.status(200).json(serviceOrders);
    } catch (error) {
      if (error instanceof AppError) {
        return response.status(error.statusCode).json({ message: error.message });
      }
      return response.status(500).json({ message: 'Internal server error' });
    }
  }
}
