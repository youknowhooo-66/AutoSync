import { useAuthStore } from '../state/auth.store'

export function useAuth() {
  const { user, isAuthenticated, token, setSession, clearSession } = useAuthStore()

  const logout = () => {
    clearSession()
    window.location.href = '/login'
  }

  return {
    user,
    token,
    isAuthenticated,
    setSession,
    logout
  }
}
