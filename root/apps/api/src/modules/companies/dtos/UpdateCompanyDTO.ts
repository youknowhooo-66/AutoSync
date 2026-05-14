// apps/api/src/modules/companies/dtos/UpdateCompanyDTO.ts

export interface UpdateCompanyDTO {
  id: string;
  name?: string;
  document?: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}
