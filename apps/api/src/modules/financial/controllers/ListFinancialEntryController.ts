// apps/api/src/modules/financial/controllers/ListFinancialEntryController.ts

import { Request, Response } from 'express';
import { AppError } from '../../../shared/errors/AppError';
import { ListFinancialEntryService } from '../services/ListFinancialEntryService';
import { logger } from "../../../shared/logger";

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
