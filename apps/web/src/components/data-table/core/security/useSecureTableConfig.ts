import { useTenantScope } from './tenantScope'
import { useColumnGuard } from './columnGuard'
import { useActionGuard } from './actionGuard'
import type { SecureColumn, SecureAction } from './types'

export function useSecureTableConfig<T>(
  columns: SecureColumn<T>[],
  actions: SecureAction[] = []
) {
  const { isValidTenant, tenantId } = useTenantScope()
  
  const secureColumns = useColumnGuard(columns)
  const secureActions = useActionGuard(actions)

  return {
    secureColumns: isValidTenant ? secureColumns : [],
    secureActions: isValidTenant ? secureActions : [],
    isAuthorized: isValidTenant,
    tenantId
  }
}
