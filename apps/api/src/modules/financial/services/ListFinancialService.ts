// apps/api/src/modules/financial/services/ListFinancialService.ts

import { IFinancialRepository, Financial } from '../repositories/IFinancialRepository';
import { AppError } from '../../../shared/errors/AppError';

export class ListFinancialService {
  constructor(private financialRepository: IFinancialRepository) {}

  async execute(companyId: string): Promise<Financial[]> {
    if (!companyId) {
      throw new AppError('Company ID is required.');
    }

    const financials = await this.financialRepository.findManyByCompany(companyId);

    return financials;
  }
}
