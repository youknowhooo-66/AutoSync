// apps/api/src/modules/financial/dtos/CreateFinancialEntryDTO.ts

export enum FinancialEntryType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export interface CreateFinancialEntryDTO {
  companyId: string;
  type: FinancialEntryType;
  amount: number;
  description: string;
  date: Date;
  categoryId?: string; // Optional: Link to a financial category
}
