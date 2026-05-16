// apps/api/src/modules/financial/repositories/IFinancialRepository.ts

import { CreateFinancialDTO, UpdateFinancialDTO, FinancialType } from '../dtos';
import { FinancialRecord as Financial } from "@prisma/client";

export interface IFinancialRepository {
  create(data: CreateFinancialDTO): Promise<Financial>;
  findById(id: string, companyId: string): Promise<Financial | null>;
  findManyByCompany(companyId: string): Promise<Financial[]>;
  update(data: UpdateFinancialDTO): Promise<Financial>;
  delete(id: string, companyId: string): Promise<void>;
}

export type { Financial };
