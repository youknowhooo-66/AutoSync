// apps/api/src/modules/companies/dtos/UpdateCompanyDTO.ts

export interface UpdateCompanyDTO {
  id: string; // The ID of the company to update, which also serves as its companyId
  name?: string;
  document?: string; // CNPJ
  address?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}
