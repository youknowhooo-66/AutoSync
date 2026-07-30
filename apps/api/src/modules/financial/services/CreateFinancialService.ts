// apps/api/src/modules/financial/services/CreateFinancialService.ts

import { IFinancialRepository, Financial } from '../repositories/IFinancialRepository';
import { CreateFinancialDTO } from '../dtos';
import { AppError } from '../../../shared/errors/AppError';

export class CreateFinancialService {
  constructor(private financialRepository: IFinancialRepository) {}

  async execute(data: CreateFinancialDTO): Promise<Financial> {
    if (!data.companyId) {
      throw new AppError('Company ID is required.');
    }

    const financial = await this.financialRepository.create(data);

    return financial;
  }
}
