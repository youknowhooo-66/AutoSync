// apps/api/src/modules/financial/services/DeleteFinancialService.ts

import { IFinancialRepository } from '../repositories/IFinancialRepository';
import { AppError } from '../../../shared/errors/AppError';

export class DeleteFinancialService {
  constructor(private financialRepository: IFinancialRepository) {}

  async execute(id: string, companyId: string): Promise<void> {
    const financialExists = await this.financialRepository.findById(id, companyId);

    if (!financialExists) {
      throw new AppError('Financial record not found.', 404);
    }

    await this.financialRepository.delete(id, companyId);
  }
}
