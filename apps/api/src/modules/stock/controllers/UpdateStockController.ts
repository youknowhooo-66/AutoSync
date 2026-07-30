// apps/api/src/modules/stock/controllers/UpdateStockController.ts

import { Request, Response } from 'express';
import { UpdateStockService } from '../services/UpdateStockService';

export class UpdateStockController {
  constructor(private updateStockService: UpdateStockService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const { productId, quantity, location, minimumStock } = request.body;
    const { companyId } = request;

    const stock = await this.updateStockService.execute({
      id,
      companyId,
      productId,
      quantity,
      location,
      minimumStock,
    } as any);

    return response.json(stock);
  }
}
