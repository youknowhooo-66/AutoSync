// apps/api/src/modules/stock/controllers/ListStockController.ts

import { Request, Response } from 'express';
import { AppError } from '../../../shared/errors/AppError';
import { ListStockService } from '../services/ListStockService';

export class ListStockController {
  constructor(private listStockService: ListStockService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { companyId } = request.query; // Assuming companyId comes from query params or context

    try {
      if (typeof companyId !== 'string') {
        throw new AppError('Company ID must be a string.', 400);
      }
      const stock = await this.listStockService.execute(companyId);

      return response.status(200).json(stock);
    } catch (error) {
      if (error instanceof AppError) {
        return response.status(error.statusCode).json({ message: error.message });
      }
      return response.status(500).json({ message: 'Internal server error' });
    }
  }
}
