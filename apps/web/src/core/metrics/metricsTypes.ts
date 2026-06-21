export interface TenantMetricsData {
  tenantId: string;
  osCreated: number;
  osCompleted: number;
  osCanceled: number;
  invoiceCreatedCount: number;
  invoicePaidCount: number;
  revenueTotal: number;
  stockMovements: number;
  totalOsCompletionTimeMs: number; // For average calculation
}

export interface KPIResult {
  tenantId: string;
  avgOsCompletionTimeMs: number;
  revenuePerOs: number;
  conversionRate: number; // OS -> Paid Invoice
  cancellationRate: number;
}
