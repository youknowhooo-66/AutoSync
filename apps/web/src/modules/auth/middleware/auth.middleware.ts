import { useAuthStore } from '../state/auth.store'

export const authMiddleware = (config: any) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`
    }
  }
  return config
}
