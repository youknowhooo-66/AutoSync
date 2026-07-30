// apps/api/src/modules/financial/services/CreateFinancialEntryService.ts

import { IFinancialEntryRepository, FinancialEntry } from '../repositories/IFinancialEntryRepository';
import { CreateFinancialDTO, FinancialType } from '../dtos';
import { AppError } from '../../../shared/errors/AppError';

export class CreateFinancialEntryService {
  constructor(private financialEntryRepository: IFinancialEntryRepository) {}

  async execute({ companyId, type, amount, description, date, categoryId }: CreateFinancialDTO): Promise<FinancialEntry> {
    if (!companyId) {
      throw new AppError('Company ID is required.');
    }
    if (!type) {
      throw new AppError('Financial entry type is required.');
    }
    if (amount === undefined || amount <= 0) {
      throw new AppError('Amount must be a positive number.');
    }
    if (!description) {
      throw new AppError('Description is required.');
    }
    if (!date) {
      throw new AppError('Date is required.');
    }

    const financialEntry = await this.financialEntryRepository.create({
      companyId,
      type,
      amount,
      description,
      date,
      categoryId,
    });

    return financialEntry;
  }
}
