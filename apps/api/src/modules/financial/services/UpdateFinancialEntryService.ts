// apps/api/src/modules/financial/services/UpdateFinancialEntryService.ts

import { IFinancialEntryRepository, FinancialEntry } from '../repositories/IFinancialEntryRepository';
import { UpdateFinancialDTO } from '../dtos';
import { AppError } from '../../../shared/errors/AppError';

export class UpdateFinancialEntryService {
  constructor(private financialEntryRepository: IFinancialEntryRepository) {}

  async execute({ id, companyId, type, amount, description, date, categoryId }: UpdateFinancialDTO): Promise<FinancialEntry> {
    if (!id || !companyId) {
      throw new AppError('Financial Entry ID and Company ID are required.');
    }

    const financialEntry = await this.financialEntryRepository.findById(id, companyId);

    if (!financialEntry) {
      throw new AppError('Financial entry not found.', 404);
    }

    if (amount !== undefined && amount <= 0) {
      throw new AppError('Amount must be a positive number.');
    }

    const updatedFinancialEntry = await this.financialEntryRepository.update({
      id,
      companyId,
      type: type || (financialEntry as any).type,
      amount: amount !== undefined ? amount : (financialEntry as any).amount,
      description: description || (financialEntry as any).description,
      date: date || (financialEntry as any).date,
      categoryId: categoryId || (financialEntry as any).categoryId,
    });

    return updatedFinancialEntry;
  }
}
