import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { useBranch } from '@/contexts/BranchContext';

export interface SupplierOption {
  id: string;
  name: string;
  cnpj?: string;
}

export function useSuppliers() {
  const { activeBranch } = useBranch();
  const activeBranchId = activeBranch?.id || '';

  return useQuery({
    queryKey: ['suppliers', activeBranchId],
    queryFn: async () => {
      const res = await api.get('/suppliers');
      const data = res.data?.data || res.data || [];
      return Array.isArray(data) ? (data as SupplierOption[]) : [];
    },
    enabled: Boolean(activeBranchId),
  });
}
