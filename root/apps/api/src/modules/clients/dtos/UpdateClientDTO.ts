// apps/api/src/modules/clients/dtos/UpdateClientDTO.ts

export interface UpdateClientDTO {
  id: string;
  companyId: string;
  name?: string;
  email?: string;
  phone?: string;
  document?: string; // CPF or CNPJ
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}
