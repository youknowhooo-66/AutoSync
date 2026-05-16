// apps/api/src/modules/financial/controllers/CreateFinancialController.ts

import { Request, Response } from 'express';
import { CreateFinancialService } from '../services/CreateFinancialService';

export class CreateFinancialController {
  constructor(private createFinancialService: CreateFinancialService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { type, amount, description, date, categoryId } = request.body;
    const { companyId } = request;

    const financial = await this.createFinancialService.execute({
      companyId,
      type,
      amount,
      description,
      date: new Date(date),
      categoryId,
    } as any);

    return response.status(201).json(financial);
  }
}
