// apps/api/src/modules/companies/services/ListCompanyService.ts

import { ICompanyRepository, Company } from '../repositories/ICompanyRepository';

export class ListCompanyService {
  constructor(private companyRepository: ICompanyRepository) {}

  async execute(): Promise<Company[]> {
    const companies = await this.companyRepository.findMany();

    return companies;
  }
}
