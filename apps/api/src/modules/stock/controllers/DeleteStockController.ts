// apps/api/src/modules/stock/controllers/DeleteStockController.ts

import { Request, Response } from 'express';
import { DeleteStockService } from '../services/DeleteStockService';

export class DeleteStockController {
  constructor(private deleteStockService: DeleteStockService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const { companyId } = request;

    await this.deleteStockService.execute(id as string, companyId as string);

    return response.status(204).send();
  }
}
