// apps/api/src/modules/financial/controllers/UpdateFinancialController.ts

import { Request, Response } from 'express';
import { UpdateFinancialService } from '../services/UpdateFinancialService';

export class UpdateFinancialController {
  constructor(private updateFinancialService: UpdateFinancialService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const { type, amount, description, date, categoryId } = request.body;
    const { companyId } = request;

    const financial = await this.updateFinancialService.execute({
      id,
      companyId,
      type,
      amount,
      description,
      date: date ? new Date(date) : undefined,
      categoryId,
    });

    return response.json(financial);
  }
}
