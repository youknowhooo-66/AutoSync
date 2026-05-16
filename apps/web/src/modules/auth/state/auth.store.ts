import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, AuthSession } from '../types/auth.types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  
  setSession: (session: AuthSession) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setSession: (session) => {
        set({ 
          user: session.user, 
          token: session.token, 
          isAuthenticated: true 
        });
        // Legacy compatibility
        localStorage.setItem('@AutoSync:token', session.token);
        localStorage.setItem('@AutoSync:user', JSON.stringify(session.user));
        localStorage.setItem('@AutoSync:companyId', session.user.tenantId);
      },
      
      clearSession: () => {
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false 
        });
        // Legacy compatibility
        localStorage.removeItem('@AutoSync:token');
        localStorage.removeItem('@AutoSync:user');
        localStorage.removeItem('@AutoSync:companyId');
      },
    }),
    {
      name: 'autosync-auth-storage',
    }
  )
)
