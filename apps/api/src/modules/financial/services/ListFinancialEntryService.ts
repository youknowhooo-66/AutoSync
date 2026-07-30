// apps/api/src/modules/financial/services/ListFinancialEntryService.ts

import { IFinancialEntryRepository, FinancialEntry } from '../repositories/IFinancialEntryRepository';
import { AppError } from '../../../shared/errors/AppError';

export class ListFinancialEntryService {
  constructor(private financialEntryRepository: IFinancialEntryRepository) {}

  async execute(companyId: string): Promise<FinancialEntry[]> {
    if (!companyId) {
      throw new AppError('Company ID is required.');
    }

    const financialEntries = await this.financialEntryRepository.findManyByCompany(companyId);

    return financialEntries;
  }
}
