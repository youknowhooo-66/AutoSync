import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockConsumptionService } from '../services/stockConsumptionService';

export const stockConsumptionKeys = {
  all: ['service-order-stock-consumption'] as const,
  byServiceOrder: (serviceOrderId: string) =>
    [...stockConsumptionKeys.all, serviceOrderId] as const,
};

export function useServiceOrderStockConsumption(serviceOrderId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: stockConsumptionKeys.byServiceOrder(serviceOrderId),
    queryFn: () => stockConsumptionService.getPartsConsumption(serviceOrderId),
    enabled: !!serviceOrderId
  });

  const consumeMutation = useMutation({
    mutationFn: ({
      partId,
      quantity,
      idempotencyKey
    }: {
      partId: string;
      quantity: number;
      idempotencyKey: string;
    }) => stockConsumptionService.consume(serviceOrderId, partId, quantity, idempotencyKey),
    onSuccess: () => {
      // Invalidate stock consumption queries
      queryClient.invalidateQueries({
        queryKey: stockConsumptionKeys.byServiceOrder(serviceOrderId)
      });
      // Invalidate general OS details
      queryClient.invalidateQueries({
        queryKey: ['os-detail', serviceOrderId]
      });
    }
  });

  return {
    partsConsumption: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    consume: consumeMutation.mutateAsync,
    isConsuming: consumeMutation.isPending
  };
}
