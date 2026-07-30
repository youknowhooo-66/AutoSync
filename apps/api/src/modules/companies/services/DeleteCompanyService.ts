// apps/api/src/modules/companies/services/DeleteCompanyService.ts

import { ICompanyRepository } from '../repositories/ICompanyRepository';
import { AppError } from '../../../shared/errors/AppError';

export class DeleteCompanyService {
  constructor(private companyRepository: ICompanyRepository) {}

  async execute(id: string): Promise<void> {
    const companyExists = await this.companyRepository.findById(id);

    if (!companyExists) {
      throw new AppError('Company not found.', 404);
    }

    await this.companyRepository.delete(id);
  }
}
