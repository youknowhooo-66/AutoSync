import { useQuery } from '@tanstack/react-query';
import { useBranch } from '@/contexts/BranchContext';
import { procurementService } from '../services/procurementService';

export function useCodeSuggestion(id?: string, enabled = false) {
  const { activeBranch } = useBranch();
  const activeBranchId = activeBranch?.id || '';

  return useQuery({
    queryKey: ['procurement', 'code-suggestion', activeBranchId, id],
    queryFn: () => procurementService.getCodeSuggestion(id!),
    enabled: Boolean(id && activeBranchId && enabled),
  });
}
