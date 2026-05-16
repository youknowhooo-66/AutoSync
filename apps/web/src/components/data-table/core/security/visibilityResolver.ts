import { usePermissions } from '@/modules/auth/hooks/usePermissions'
import type { AppPermission } from '@/modules/auth/types/roles.types'

export type VisibilityResult = 'ALLOW' | 'DENY' | 'HIDE' | 'DISABLE'

export function useVisibilityResolver() {
  const { can } = usePermissions()

  const resolve = (permission?: AppPermission, hiddenIfUnauthorized: boolean = true): VisibilityResult => {
    if (!permission) return 'ALLOW'
    
    const hasPermission = can(permission)
    
    if (hasPermission) return 'ALLOW'
    
    return hiddenIfUnauthorized ? 'HIDE' : 'DISABLE'
  }

  return { resolve }
}
