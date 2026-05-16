import { QueryClient } from '@tanstack/react-query';

export async function executeOptimisticUpdate<TData, TVariables>(
  queryClient: QueryClient,
  queryKey: unknown[],
  updater: (oldData: TData | undefined) => TData
): Promise<{ previousData: TData | undefined }> {
  // Cancel any outgoing refetches to prevent overwriting our optimistic update
  await queryClient.cancelQueries({ queryKey });

  // Snapshot the previous value
  const previousData = queryClient.getQueryData<TData>(queryKey);

  // Optimistically update to the new value
  queryClient.setQueryData<TData>(queryKey, updater);

  return { previousData };
}

export function rollbackOptimisticUpdate<TData>(
  queryClient: QueryClient,
  queryKey: unknown[],
  previousData: TData | undefined
) {
  if (previousData !== undefined) {
    queryClient.setQueryData(queryKey, previousData);
    console.warn(`[Rollback] State reverted for queryKey: ${queryKey}`);
  }
}
