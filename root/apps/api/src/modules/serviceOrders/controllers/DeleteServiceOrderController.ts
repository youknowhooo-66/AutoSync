// apps/api/src/modules/serviceOrders/controllers/DeleteServiceOrderController.ts

import { Request, Response } from 'express';
import { AppError } from '../../../shared/errors/AppError';
import { DeleteServiceOrderService } from '../services/DeleteServiceOrderService';

export class DeleteServiceOrderController {
  constructor(private deleteServiceOrderService: DeleteServiceOrderService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const { companyId } = request.body; // Assuming companyId comes from body or context

    try {
      await this.deleteServiceOrderService.execute(id, companyId);

      return response.status(204).send();
    } catch (error) {
      if (error instanceof AppError) {
        return response.status(error.statusCode).json({ message: error.message });
      }
      return response.status(500).json({ message: 'Internal server error' });
    }
  }
}
