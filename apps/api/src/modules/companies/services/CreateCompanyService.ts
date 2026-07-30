// apps/api/src/modules/companies/services/CreateCompanyService.ts

import { ICompanyRepository, Company } from '../repositories/ICompanyRepository';
import { CreateCompanyDTO } from '../dtos';
import { AppError } from '../../../shared/errors/AppError';

export class CreateCompanyService {
  constructor(private companyRepository: ICompanyRepository) {}

  async execute(data: CreateCompanyDTO): Promise<Company> {
    const { document } = data;

    const companyExists = await this.companyRepository.findByDocument(document);

    if (companyExists) {
      throw new AppError('Company with this document already exists.', 409);
    }

    const company = await this.companyRepository.create(data);

    return company;
  }
}
