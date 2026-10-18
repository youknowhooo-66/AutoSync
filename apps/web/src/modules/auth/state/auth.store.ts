import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, AuthSession } from '../types/auth.types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean

  setSession: (session: AuthSession) => void
  clearSession: () => void
}

// The JWT lives in an httpOnly cookie set by the API, so scripts on the page
// (including injected ones) cannot read it. Only the user profile is kept here.
const LEGACY_KEYS = ['@AutoSync:token', '@AutoSync:user', '@AutoSync:companyId']
// The selected branch belongs to the previous user; sending it after another login
// on the same browser would be rejected with BRANCH_FORBIDDEN.
const SESSION_KEYS = ['@AutoSync:branchId', '@AutoSync:activeBranch']

function removeKeys(keys: string[]) {
  try {
    keys.forEach((key) => localStorage.removeItem(key))
  } catch {
    // Storage can be unavailable (private mode); nothing to clean up then.
  }
}

const dropLegacyKeys = () => removeKeys(LEGACY_KEYS)

dropLegacyKeys()

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setSession: (session) => {
        set({
          user: session.user,
          isAuthenticated: true
        });
      },

      clearSession: () => {
        set({
          user: null,
          isAuthenticated: false
        });
        removeKeys([...LEGACY_KEYS, ...SESSION_KEYS]);
      },
    }),
    {
      name: 'autosync-auth-storage',
      // Older versions persisted the token here too; never write it back.
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)
