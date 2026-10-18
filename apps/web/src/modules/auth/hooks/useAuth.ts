import { useAuthStore } from '../state/auth.store'
import api from '@/services/api'

export function useAuth() {
  const { user, isAuthenticated, setSession, clearSession } = useAuthStore()

  const logout = async () => {
    try {
      // Only the API can clear the httpOnly session cookie.
      await api.post('/auth/logout')
    } catch {
      // Log out locally even if the API is unreachable; the cookie expires on its own.
    } finally {
      clearSession()
      window.location.href = '/login'
    }
  }

  return {
    user,
    isAuthenticated,
    setSession,
    logout
  }
}
