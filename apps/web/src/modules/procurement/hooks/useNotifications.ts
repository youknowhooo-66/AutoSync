import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/modules/auth/state/auth.store';
import { useBranch } from '@/contexts/BranchContext';
import { procurementService } from '../services/procurementService';

export function useNotifications(unreadOnly = false) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { activeBranch } = useBranch();

  const userId = user?.id || '';
  const activeBranchId = activeBranch?.id || '';

  const query = useQuery({
    queryKey: ['notifications', userId, activeBranchId, { unreadOnly }],
    queryFn: () => procurementService.listNotifications(unreadOnly),
    enabled: Boolean(userId && activeBranchId),
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => procurementService.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => procurementService.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    ...query,
    markReadMutation,
    markAllReadMutation,
  };
}
