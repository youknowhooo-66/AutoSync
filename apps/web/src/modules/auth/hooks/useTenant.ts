import { useAuthStore } from '../state/auth.store'

export function useTenant() {
  const user = useAuthStore(state => state.user)

  return {
    tenantId: user?.tenantId || null,
    tenantInfo: user?.tenant || null,
    // Em um cenário real de multi-empresa com 1 usuário tendo várias empresas, 
    // switchTenant iria despachar uma mutação e atualizar o auth.store
    switchTenant: (newTenantId: string) => {
      console.warn(`Switching to tenant ${newTenantId} is not implemented yet`)
    }
  }
}
