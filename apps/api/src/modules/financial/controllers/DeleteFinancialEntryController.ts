// apps/api/src/modules/financial/controllers/DeleteFinancialEntryController.ts

import { Request, Response } from 'express';
import { AppError } from '../../../shared/errors/AppError';
import { DeleteFinancialEntryService } from '../services/DeleteFinancialEntryService';
import { logger } from "../../../shared/logger";

export class DeleteFinancialEntryController {
  constructor(private deleteFinancialEntryService: DeleteFinancialEntryService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const { companyId } = request.body; // Assuming companyId comes from body or context

    try {
      await this.deleteFinancialEntryService.execute(id as string, companyId as string);

      return response.status(204).send();
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
