import { useAuthStore } from '../state/auth.store'

export const tenantMiddleware = (config: any) => {
  const tenantId = useAuthStore.getState().user?.tenantId
  if (tenantId) {
    config.headers = {
      ...config.headers,
      'X-Tenant-Id': tenantId
    }
    // Auto-inject tenantId in body or params if needed, but headers is standard for API Gateway isolation
  }
  return config
}
