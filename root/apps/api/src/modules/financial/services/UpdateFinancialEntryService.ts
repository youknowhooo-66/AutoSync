// apps/api/src/modules/financial/services/UpdateFinancialEntryService.ts

import { IFinancialEntryRepository, FinancialEntry } from '../repositories/IFinancialEntryRepository';
import { UpdateFinancialEntryDTO } from '../dtos';
import { AppError } from '../../../shared/errors/AppError';

export class UpdateFinancialEntryService {
  constructor(private financialEntryRepository: IFinancialEntryRepository) {}

  async execute({ id, companyId, type, amount, description, date, categoryId }: UpdateFinancialEntryDTO): Promise<FinancialEntry> {
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
      type: type || financialEntry.type,
      amount: amount !== undefined ? amount : financialEntry.amount,
      description: description || financialEntry.description,
      date: date || financialEntry.date,
      categoryId: categoryId || financialEntry.categoryId,
    });

    return updatedFinancialEntry;
  }
}
