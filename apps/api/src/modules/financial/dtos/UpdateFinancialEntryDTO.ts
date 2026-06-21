// apps/api/src/modules/financial/dtos/UpdateFinancialDTO.ts

import { FinancialType } from './CreateFinancialDTO';

export interface UpdateFinancialDTO {
  id: string;
  companyId: string;
  type?: FinancialType;
  amount?: number;
  description?: string;
  date?: Date;
  categoryId?: string;
}
