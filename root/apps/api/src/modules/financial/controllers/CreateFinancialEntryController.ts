// apps/api/src/modules/financial/controllers/CreateFinancialEntryController.ts

import { Request, Response } from 'express';
import { AppError } from '../../../shared/errors/AppError';
import { CreateFinancialEntryService } from '../services/CreateFinancialEntryService';
import { FinancialEntryType } from '../dtos';

export class CreateFinancialEntryController {
  constructor(private createFinancialEntryService: CreateFinancialEntryService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { companyId, type, amount, description, date, categoryId } = request.body;

    try {
      const financialEntry = await this.createFinancialEntryService.execute({
        companyId,
        type: type as FinancialEntryType, // Cast to enum
        amount,
        description,
        date: new Date(date), // Convert string to Date
        categoryId,
      });

      return response.status(201).json(financialEntry);
    } catch (error) {
      if (error instanceof AppError) {
        return response.status(error.statusCode).json({ message: error.message });
      }
      return response.status(500).json({ message: 'Internal server error' });
    }
  }
}
