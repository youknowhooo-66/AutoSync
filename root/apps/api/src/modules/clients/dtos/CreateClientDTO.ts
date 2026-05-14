// apps/api/src/modules/clients/dtos/CreateClientDTO.ts

export interface CreateClientDTO {
  companyId: string;
  name: string;
  email: string;
  phone?: string;
  document?: string; // CPF or CNPJ
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}
