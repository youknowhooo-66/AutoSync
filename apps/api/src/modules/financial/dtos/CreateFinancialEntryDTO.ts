// apps/api/src/modules/financial/dtos/CreateFinancialDTO.ts

export enum FinancialType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export interface CreateFinancialDTO {
  companyId: string;
  type: FinancialType;
  amount: number;
  description: string;
  date: Date;
  categoryId?: string; // Optional: Link to a financial category
}
