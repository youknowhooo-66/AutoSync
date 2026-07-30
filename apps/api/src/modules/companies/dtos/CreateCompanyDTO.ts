// apps/api/src/modules/companies/dtos/CreateCompanyDTO.ts

export interface CreateCompanyDTO {
  name: string;
  document: string; // CNPJ
  address?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}
