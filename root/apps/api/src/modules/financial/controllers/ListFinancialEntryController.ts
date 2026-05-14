// apps/api/src/modules/financial/controllers/ListFinancialEntryController.ts

import { Request, Response } from 'express';
import { AppError } from '../../../shared/errors/AppError';
import { ListFinancialEntryService } from '../services/ListFinancialEntryService';

export class ListFinancialEntryController {
  constructor(private listFinancialEntryService: ListFinancialEntryService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { companyId } = request.query; // Assuming companyId comes from query params or context

    try {
      if (typeof companyId !== 'string') {
        throw new AppError('Company ID must be a string.', 400);
      }
      const financialEntries = await this.listFinancialEntryService.execute(companyId);

      return response.status(200).json(financialEntries);
    } catch (error) {
      if (error instanceof AppError) {
        return response.status(error.statusCode).json({ message: error.message });
      }
      return response.status(500).json({ message: 'Internal server error' });
    }
  }
}
