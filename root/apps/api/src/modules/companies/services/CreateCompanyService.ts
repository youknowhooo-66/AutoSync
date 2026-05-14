// apps/api/src/modules/companies/services/CreateCompanyService.ts

import { ICompanyRepository, Company } from '../repositories/ICompanyRepository';
import { CreateCompanyDTO } from '../dtos';
import { AppError } from '../../../shared/errors/AppError';

export class CreateCompanyService {
  constructor(private companyRepository: ICompanyRepository) {}

  async execute({ name, document, address, phone, email, isActive }: CreateCompanyDTO): Promise<Company> {
    if (!name) {
      throw new AppError('Company name is required.');
    }
    if (!document) {
      throw new AppError('Company document (CNPJ) is required.');
    }

    const companyExists = await this.companyRepository.findByDocument(document);

    if (companyExists) {
      throw new AppError('Company with this document already exists.', 409);
    }

    const company = await this.companyRepository.create({
      name,
      document,
      address,
      phone,
      email,
      isActive,
    });

    return company;
  }
}
