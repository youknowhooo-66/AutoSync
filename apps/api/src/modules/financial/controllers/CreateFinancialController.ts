// apps/api/src/modules/financial/controllers/CreateFinancialController.ts

import { Request, Response } from 'express';
import { container } from '../../../container';

export class CreateFinancialController {
  async handle(request: Request, response: Response): Promise<Response> {
    const { type, amount, dueDate, description, date, categoryId, referenceId } = request.body;
    const { companyId } = request.user || request;

    try {
      const payload = {
        companyId: String(companyId),
        type: (type === 'INCOME' ? 'RECEIVABLE' : 'PAYABLE') as 'RECEIVABLE' | 'PAYABLE',
        amount: Number(amount),
        dueDate: dueDate ? new Date(dueDate) : new Date(date),
        referenceId: referenceId || description,
      };

      const entryId = await container.useCases.financial.createFinancialEntry.execute(payload);

      const created = await container.queries.finance.financialQueryService.getFinancialEntryById(entryId, String(companyId));

      return response.status(201).json(created);
    } catch (error: any) {
      return response.status(400).json({ message: error.message || 'Error creating financial entry' });
    }
  }
}

