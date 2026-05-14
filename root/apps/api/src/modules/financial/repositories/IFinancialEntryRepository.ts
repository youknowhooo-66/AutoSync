// apps/api/src/modules/financial/repositories/IFinancialEntryRepository.ts

import { CreateFinancialEntryDTO, UpdateFinancialEntryDTO, FinancialEntryType } from '../dtos';

export interface FinancialEntry {
  id: string;
  companyId: string;
  type: FinancialEntryType;
  amount: number;
  description: string;
  date: Date;
  categoryId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFinancialEntryRepository {
  create(data: CreateFinancialEntryDTO): Promise<FinancialEntry>;
  findById(id: string, companyId: string): Promise<FinancialEntry | null>;
  findManyByCompany(companyId: string): Promise<FinancialEntry[]>;
  update(data: UpdateFinancialEntryDTO): Promise<FinancialEntry>;
  delete(id: string, companyId: string): Promise<void>;
}
