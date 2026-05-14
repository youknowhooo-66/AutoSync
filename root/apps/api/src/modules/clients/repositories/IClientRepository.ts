// apps/api/src/modules/clients/repositories/IClientRepository.ts

import { CreateClientDTO, UpdateClientDTO } from '../dtos';

export interface Client {
  id: string;
  companyId: string;
  name: string;
  email: string;
  phone?: string;
  document?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IClientRepository {
  create(data: CreateClientDTO): Promise<Client>;
  findById(id: string, companyId: string): Promise<Client | null>;
  findByName(name: string, companyId: string): Promise<Client | null>;
  findManyByCompany(companyId: string): Promise<Client[]>;
  update(data: UpdateClientDTO): Promise<Client>;
  delete(id: string, companyId: string): Promise<void>;
}
