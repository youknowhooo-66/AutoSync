// apps/api/src/modules/companies/repositories/ICompanyRepository.ts

import { CreateCompanyDTO, UpdateCompanyDTO } from '../dtos';

export interface Company {
  id: string;
  name: string;
  document: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICompanyRepository {
  create(data: CreateCompanyDTO): Promise<Company>;
  findById(id: string): Promise<Company | null>;
  findByDocument(document: string): Promise<Company | null>;
  findMany(): Promise<Company[]>;
  update(data: UpdateCompanyDTO): Promise<Company>;
  delete(id: string): Promise<void>;
}
