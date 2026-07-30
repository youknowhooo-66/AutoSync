export interface FinancialDashboardView {
  companyId: string;
  totalRevenue: number;
  totalCosts: number;
  grossMargin: number;
  invoicesIssued: number;
  accountsReceivable: number;
  accountsPayable: number;
  lastUpdatedAt: Date;
}
