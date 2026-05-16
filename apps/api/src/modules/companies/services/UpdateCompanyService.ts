// apps/api/src/modules/companies/services/UpdateCompanyService.ts

import { ICompanyRepository, Company } from '../repositories/ICompanyRepository';
import { UpdateCompanyDTO } from '../dtos';
import { AppError } from '../../../shared/errors/AppError';

export class UpdateCompanyService {
  constructor(private companyRepository: ICompanyRepository) {}

  async execute(data: UpdateCompanyDTO): Promise<Company> {
    const { id } = data;

    const companyExists = await this.companyRepository.findById(id);

    if (!companyExists) {
      throw new AppError('Company not found.', 404);
    }

    const company = await this.companyRepository.update(data);

    return company;
  }
}
