// apps/api/src/modules/companies/services/DeleteCompanyService.ts

import { ICompanyRepository } from '../repositories/ICompanyRepository';
import { AppError } from '../../../shared/errors/AppError';

export class DeleteCompanyService {
  constructor(private companyRepository: ICompanyRepository) {}

  async execute(id: string): Promise<void> {
    if (!id) {
      throw new AppError('Company ID is required.');
    }

    const company = await this.companyRepository.findById(id);

    if (!company) {
      throw new AppError('Company not found.', 404);
    }

    await this.companyRepository.delete(id);
  }
}
