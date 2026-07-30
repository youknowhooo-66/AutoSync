// apps/api/src/modules/stock/controllers/ListStockController.ts

import { Request, Response } from 'express';
import { ListStockService } from '../services/ListStockService';

export class ListStockController {
  constructor(private listStockService: ListStockService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { companyId } = request;

    const stocks = await this.listStockService.execute(companyId);

    return response.json(stocks);
  }
}
