// apps/api/src/modules/stock/controllers/UpdateStockController.ts

import { Request, Response } from 'express';
import { AppError } from '../../../shared/errors/AppError';
import { UpdateStockService } from '../services/UpdateStockService';

export class UpdateStockController {
  constructor(private updateStockService: UpdateStockService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const { companyId, productId, quantity, location, minimumStock } = request.body;

    try {
      const stock = await this.updateStockService.execute({
        id,
        companyId,
        productId,
        quantity,
        location,
        minimumStock,
      });

      return response.status(200).json(stock);
    } catch (error) {
      if (error instanceof AppError) {
        return response.status(error.statusCode).json({ message: error.message });
      }
      return response.status(500).json({ message: 'Internal server error' });
    }
  }
}
