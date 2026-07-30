import { useQuery } from '@tanstack/react-query';
import { useContext } from 'react';
import { BranchContext } from '@/contexts/BranchContext';
import { procurementService } from '../services/procurementService';

export function usePurchaseRequest(id?: string) {
  const context = useContext(BranchContext);
  const activeBranchId = context?.activeBranch?.id || (typeof window !== 'undefined' ? localStorage.getItem('@AutoSync:branchId') : null) || '';

  return useQuery({
    queryKey: ['procurement', 'request', activeBranchId, id],
    queryFn: () => procurementService.getPartRequest(id!),
    enabled: Boolean(id && activeBranchId),
  });
}
