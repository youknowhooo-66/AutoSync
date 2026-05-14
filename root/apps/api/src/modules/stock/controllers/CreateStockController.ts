// apps/api/src/modules/stock/controllers/CreateStockController.ts

import { Request, Response } from 'express';
import { AppError } from '../../../shared/errors/AppError';
import { CreateStockService } from '../services/CreateStockService';

export class CreateStockController {
  constructor(private createStockService: CreateStockService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { companyId, productId, quantity, location, minimumStock } = request.body;

    try {
      const stock = await this.createStockService.execute({
        companyId,
        productId,
        quantity,
        location,
        minimumStock,
      });

      return response.status(201).json(stock);
    } catch (error) {
      if (error instanceof AppError) {
        return response.status(error.statusCode).json({ message: error.message });
      }
      return response.status(500).json({ message: 'Internal server error' });
    }
  }
}
