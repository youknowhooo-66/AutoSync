import { useQuery } from '@tanstack/react-query';
import { stockService } from '../services/stockService';

export function useStock(page = 1, limit = 10, search = '') {
  return useQuery({
    queryKey: ['stock', { page, limit, search }],
    queryFn: () => stockService.list(page, limit, search),
  });
}

export function useStockSummary() {
  return useQuery({
    queryKey: ['stock-summary'],
    queryFn: () => stockService.getSummary(),
  });
}

export function useStockMovements(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['stock-movements', { page, limit }],
    queryFn: () => stockService.getMovements(page, limit),
  });
}

export function useStockItem(id: string) {
  return useQuery({
    queryKey: ['stock', id],
    queryFn: () => stockService.getById(id),
    enabled: !!id,
  });
}
