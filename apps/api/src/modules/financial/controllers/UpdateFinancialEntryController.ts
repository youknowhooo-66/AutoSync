// apps/api/src/modules/financial/controllers/UpdateFinancialEntryController.ts

import { Request, Response } from 'express';
import { AppError } from '../../../shared/errors/AppError';
import { UpdateFinancialEntryService } from '../services/UpdateFinancialEntryService';
import { FinancialType } from '../dtos';
import { logger } from "../../../shared/logger";

export class UpdateFinancialEntryController {
  constructor(private updateFinancialEntryService: UpdateFinancialEntryService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const { companyId, type, amount, description, date, categoryId } = request.body;

    try {
      const financialEntry = await this.updateFinancialEntryService.execute({
        id,
        companyId,
        type: type as FinancialType, // Cast to enum
        amount,
        description,
        date: date ? new Date(date) : undefined, // Convert string to Date if provided
        categoryId,
      } as any);

      return response.status(200).json(financialEntry);
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
