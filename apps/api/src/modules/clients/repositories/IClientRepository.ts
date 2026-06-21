// apps/api/src/modules/clients/repositories/IClientRepository.ts

import { CreateClientDTO, UpdateClientDTO } from '../dtos';
import { Client } from "@prisma/client";

export interface IClientRepository {
  create(data: CreateClientDTO): Promise<Client>;
  findById(id: string, companyId: string): Promise<Client | null>;
  findByName(name: string, companyId: string): Promise<Client | null>;
  findManyByCompany(companyId: string): Promise<Client[]>;
  update(data: UpdateClientDTO): Promise<Client>;
  delete(id: string, companyId: string): Promise<void>;
}

export type { Client };
