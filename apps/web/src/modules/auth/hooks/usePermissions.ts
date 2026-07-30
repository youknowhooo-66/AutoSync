import { useAuthStore } from '../state/auth.store'
import { ROLE_PERMISSIONS, type AppPermission, type Role } from '../types/roles.types'

export function usePermissions() {
  const user = useAuthStore(state => state.user)
  
  const role: Role | null = user?.role || null
  const permissions = role ? ROLE_PERMISSIONS[role] : []

  const can = (action: AppPermission): boolean => {
    if (!role) return false
    // Admin tem bypass se quisermos, mas como as permissões do ADMIN estão explicitamente setadas, 
    // basta checar se está na lista
    return permissions.includes(action)
  }

  const cannot = (action: AppPermission): boolean => {
    return !can(action)
  }

  return {
    role,
    permissions,
    can,
    cannot
  }
}
