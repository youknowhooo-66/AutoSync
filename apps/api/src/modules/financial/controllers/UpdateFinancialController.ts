// apps/api/src/modules/financial/controllers/UpdateFinancialController.ts

import { Request, Response } from 'express';
import { container } from '../../../container';

export class UpdateFinancialController {
  async handle(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const { type, amount, description, date, dueDate, categoryId, referenceId } = request.body;
    const { companyId } = request.user || request;

    try {
      const payload = {
        entryId: id,
        companyId: String(companyId),
        type: type ? ((type === 'INCOME' ? 'RECEIVABLE' : 'PAYABLE') as 'RECEIVABLE' | 'PAYABLE') : undefined,
        amount: amount !== undefined ? Number(amount) : undefined,
        dueDate: dueDate ? new Date(dueDate) : (date ? new Date(date) : undefined),
        referenceId: referenceId || description,
      };

      await container.useCases.financial.updateFinancialEntry.execute(payload);

      const updated = await container.queries.finance.financialQueryService.getFinancialEntryById(id as string, String(companyId));

      return response.json(updated);
    } catch (error: any) {
      return response.status(400).json({ message: error.message || 'Error updating financial entry' });
    }
  }
}

