import { useMutation, useQueryClient } from '@tanstack/react-query';
import { procurementService } from '../services/procurementService';
import type {
  CreatePartRequestInput,
  RegisterPurchaseInput,
  ReceivePartInput,
  InstallPartInput,
  CancelPartRequestInput,
} from '../types/procurement.types';

export function useProcurementMutations() {
  const queryClient = useQueryClient();

  const invalidateProcurementData = () => {
    queryClient.invalidateQueries({ queryKey: ['procurement'] });
    queryClient.invalidateQueries({ queryKey: ['service-orders'] });
    queryClient.invalidateQueries({ queryKey: ['service-order'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['stock'] });
  };

  const createRequestMutation = useMutation({
    mutationFn: (input: CreatePartRequestInput) => procurementService.createPartRequest(input),
    onSuccess: () => invalidateProcurementData(),
  });

  const startProgressMutation = useMutation({
    mutationFn: (id: string) => procurementService.startProgress(id),
    onSuccess: () => invalidateProcurementData(),
  });

  const registerPurchaseMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: RegisterPurchaseInput }) =>
      procurementService.registerPurchase(id, input),
    onSuccess: () => invalidateProcurementData(),
  });

  const receivePartMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: ReceivePartInput }) =>
      procurementService.receivePart(id, input),
    onSuccess: () => invalidateProcurementData(),
  });

  const installPartMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input?: InstallPartInput }) =>
      procurementService.installPart(id, input),
    onSuccess: () => invalidateProcurementData(),
  });

  const cancelRequestMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CancelPartRequestInput }) =>
      procurementService.cancelPartRequest(id, input),
    onSuccess: () => invalidateProcurementData(),
  });

  return {
    createRequestMutation,
    startProgressMutation,
    registerPurchaseMutation,
    receivePartMutation,
    installPartMutation,
    cancelRequestMutation,
  };
}
