// apps/api/src/modules/stock/controllers/CreateStockController.ts

import { Request, Response } from 'express';
import { CreateStockService } from '../services/CreateStockService';

export class CreateStockController {
  constructor(private createStockService: CreateStockService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { productId, quantity, location, minimumStock } = request.body;
    const { companyId } = request;

    const stock = await this.createStockService.execute({
      companyId,
      productId,
      quantity,
      location,
      minimumStock,
    });

    return response.status(201).json(stock);
  }
}
