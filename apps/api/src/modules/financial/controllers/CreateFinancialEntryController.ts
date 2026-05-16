// apps/api/src/modules/financial/controllers/CreateFinancialEntryController.ts

import { Request, Response } from 'express';
import { AppError } from '../../../shared/errors/AppError';
import { CreateFinancialEntryService } from '../services/CreateFinancialEntryService';
import { FinancialType } from '../dtos';
import { logger } from "../../../shared/logger";

export class CreateFinancialEntryController {
  constructor(private createFinancialEntryService: CreateFinancialEntryService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { companyId, type, amount, description, date, categoryId } = request.body;

    try {
      const financialEntry = await this.createFinancialEntryService.execute({
        companyId,
        type: type as FinancialType, // Cast to enum
        amount,
        description,
        date: new Date(date), // Convert string to Date
        categoryId,
      } as any);

      return response.status(201).json(financialEntry);
    } catch (error: unknown) {
    if (error instanceof Error) {
      if (error instanceof AppError) {
          return response.status(error.statusCode).json({ message: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) });
        }
      return response.status(500).json({ message: 'Internal server error' });
    } else {
      logger.error({ err: error }, "An unknown error occurred");
      return response.status(500).json({ message: 'An unknown error occurred' });    }
  }
  }
}
