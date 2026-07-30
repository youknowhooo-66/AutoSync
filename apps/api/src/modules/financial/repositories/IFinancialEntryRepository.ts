// apps/api/src/modules/financial/repositories/IFinancialEntryRepository.ts

import { CreateFinancialDTO, UpdateFinancialDTO, FinancialType } from '../dtos';
import { FinancialRecord as FinancialEntry } from "@prisma/client";

export interface IFinancialEntryRepository {
  create(data: CreateFinancialDTO): Promise<FinancialEntry>;
  findById(id: string, companyId: string): Promise<FinancialEntry | null>;
  findManyByCompany(companyId: string): Promise<FinancialEntry[]>;
  update(data: UpdateFinancialDTO): Promise<FinancialEntry>;
  delete(id: string, companyId: string): Promise<void>;
}

export type { FinancialEntry };
