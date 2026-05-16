// apps/api/src/modules/financial/services/DeleteFinancialEntryService.ts

import { IFinancialEntryRepository } from '../repositories/IFinancialEntryRepository';
import { AppError } from '../../../shared/errors/AppError';

export class DeleteFinancialEntryService {
  constructor(private financialEntryRepository: IFinancialEntryRepository) {}

  async execute(id: string, companyId: string): Promise<void> {
    if (!id || !companyId) {
      throw new AppError('Financial Entry ID and Company ID are required.');
    }

    const financialEntry = await this.financialEntryRepository.findById(id, companyId);

    if (!financialEntry) {
      throw new AppError('Financial entry not found.', 404);
    }

    await this.financialEntryRepository.delete(id, companyId);
  }
}
