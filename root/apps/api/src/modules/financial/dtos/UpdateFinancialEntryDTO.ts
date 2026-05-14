// apps/api/src/modules/financial/dtos/UpdateFinancialEntryDTO.ts

import { FinancialEntryType } from './CreateFinancialEntryDTO';

export interface UpdateFinancialEntryDTO {
  id: string;
  companyId: string;
  type?: FinancialEntryType;
  amount?: number;
  description?: string;
  date?: Date;
  categoryId?: string;
}
