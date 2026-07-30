import { useQuery } from '@tanstack/react-query';
import { useContext } from 'react';
import { BranchContext } from '@/contexts/BranchContext';
import { procurementService } from '../services/procurementService';
import type { PurchaseRequestFilters } from '../types/procurement.types';

export function usePurchaseRequests(filters?: PurchaseRequestFilters) {
  const context = useContext(BranchContext);
  const activeBranchId = context?.activeBranch?.id || (typeof window !== 'undefined' ? localStorage.getItem('@AutoSync:branchId') : null) || '';

  return useQuery({
    queryKey: ['procurement', 'requests', activeBranchId, filters],
    queryFn: () => procurementService.listPartRequests(filters),
    enabled: Boolean(activeBranchId),
  });
}
