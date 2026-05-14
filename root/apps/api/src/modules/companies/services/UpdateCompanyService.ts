// apps/api/src/modules/companies/services/UpdateCompanyService.ts

import { ICompanyRepository, Company } from '../repositories/ICompanyRepository';
import { UpdateCompanyDTO } from '../dtos';
import { AppError } from '../../../shared/errors/AppError';

export class UpdateCompanyService {
  constructor(private companyRepository: ICompanyRepository) {}

  async execute({ id, name, document, address, phone, email, isActive }: UpdateCompanyDTO): Promise<Company> {
    if (!id) {
      throw new AppError('Company ID is required.');
    }

    const company = await this.companyRepository.findById(id);

    if (!company) {
      throw new AppError('Company not found.', 404);
    }

    if (document && document !== company.document) {
      const companyExists = await this.companyRepository.findByDocument(document);
      if (companyExists && companyExists.id !== id) {
        throw new AppError('Company with this document already exists.', 409);
      }
    }

    const updatedCompany = await this.companyRepository.update({
      id,
      name: name || company.name,
      document: document || company.document,
      address: address || company.address,
      phone: phone || company.phone,
      email: email || company.email,
      isActive: isActive !== undefined ? isActive : company.isActive,
    });

    return updatedCompany;
  }
}
