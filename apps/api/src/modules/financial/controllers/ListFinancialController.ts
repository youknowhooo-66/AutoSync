// apps/api/src/modules/financial/controllers/ListFinancialController.ts

import { Request, Response } from 'express';
import { ListFinancialService } from '../services/ListFinancialService';

export class ListFinancialController {
  constructor(private listFinancialService: ListFinancialService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { companyId } = request;

    const financials = await this.listFinancialService.execute(companyId);

    return response.json(financials);
  }
}
