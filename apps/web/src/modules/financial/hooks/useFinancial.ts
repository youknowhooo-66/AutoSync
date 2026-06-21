import { useQuery } from '@tanstack/react-query';
import { financialService } from '../services/financialService';

export function useFinancialDashboard(range: string = '30d') {
  return useQuery({
    queryKey: ['financial-dashboard', range],
    queryFn: () => financialService.getDashboardData(range),
  });
}

export function useFinancialReport(filters: any) {
  return useQuery({
    queryKey: ['financial-report', filters],
    queryFn: () => financialService.getReport(filters),
    enabled: !!filters.startDate && !!filters.endDate,
  });
}
