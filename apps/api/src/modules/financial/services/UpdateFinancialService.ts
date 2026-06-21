// apps/api/src/modules/financial/services/UpdateFinancialService.ts

import { IFinancialRepository, Financial } from '../repositories/IFinancialRepository';
import { UpdateFinancialDTO } from '../dtos';
import { AppError } from '../../../shared/errors/AppError';

export class UpdateFinancialService {
  constructor(private financialRepository: IFinancialRepository) {}

  async execute(data: UpdateFinancialDTO): Promise<Financial> {
    const { id, companyId } = data;

    const financialExists = await this.financialRepository.findById(id, companyId);

    if (!financialExists) {
      throw new AppError('Financial record not found.', 404);
    }

    const financial = await this.financialRepository.update(data);

    return financial;
  }
}
