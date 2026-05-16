import { QueryClient } from '@tanstack/react-query';
import { AuditLog } from '@/core/audit/auditLog';

export function setupQueryMonitor(queryClient: QueryClient) {
  queryClient.getQueryCache().subscribe((event) => {
    if (event.type === 'updated' && event.action.type === 'error') {
      const query = event.query;
      AuditLog.create({
        tenantId: 'SYSTEM',
        userId: 'SYSTEM',
        action: 'QUERY_ERROR',
        module: 'network',
        after: {
          queryKey: query.queryKey,
          error: query.state.error
        }
      });
    }
  });

  console.log('[Observability] Query monitor active.');
}
