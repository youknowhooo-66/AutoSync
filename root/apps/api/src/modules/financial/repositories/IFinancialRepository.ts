// apps/api/src/modules/financial/repositories/IFinancialRepository.ts

import { CreateFinancialDTO, UpdateFinancialDTO, FinancialType } from '../dtos';

export interface Financial {
  id: string;
  companyId: string;
  type: FinancialType;
  amount: number;
  description: string;
  date: Date;
  categoryId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFinancialRepository {
  create(data: CreateFinancialDTO): Promise<Financial>;
  findById(id: string, companyId: string): Promise<Financial | null>;
  findManyByCompany(companyId: string): Promise<Financial[]>;
  update(data: UpdateFinancialDTO): Promise<Financial>;
  delete(id: string, companyId: string): Promise<void>;
}
