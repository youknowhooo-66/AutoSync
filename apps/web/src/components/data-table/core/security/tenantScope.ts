import { useAuthStore } from '@/modules/auth/state/auth.store'

export function useTenantScope() {
  const tenantId = useAuthStore(state => state.user?.tenantId)

  return {
    tenantId,
    isValidTenant: !!tenantId,
    getTenantCacheKey: (module: string, filters: any = {}) => [
      module,
      tenantId || 'NO_TENANT',
      filters
    ]
  }
}
