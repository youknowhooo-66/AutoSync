import { useAuthStore } from '../state/auth.store'
import { ROLE_PERMISSIONS, type AppPermission } from '../types/roles.types'

export const checkPermission = (action: AppPermission): boolean => {
  const user = useAuthStore.getState().user
  if (!user || !user.role) return false
  
  const permissions = ROLE_PERMISSIONS[user.role] || []
  return permissions.includes(action)
}
