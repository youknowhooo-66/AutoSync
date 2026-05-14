export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  averageTicket: number;
  totalServiceOrders: number;
}

export interface RevenuePoint {
  date: string;
  amount: number;
}

export interface TopClient {
  name: string;
  revenue: number;
  orders: number;
}

export interface FinancialAnalytics {
  summary: FinancialSummary;
  revenueByDate: RevenuePoint[];
  topClients: TopClient[];
}
