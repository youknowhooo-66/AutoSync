import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'VIEWER';
  companyId: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  companyId: string | null;
  isAuthenticated: boolean;
  signIn: (user: User, token: string) => void;
  signOut: () => void;
  setCompanyId: (id: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      companyId: null,
      isAuthenticated: false,

      signIn: (user, token) => {
        set({ user, token, isAuthenticated: true, companyId: user.companyId });
        localStorage.setItem('@AutoSync:token', token);
        localStorage.setItem('@AutoSync:companyId', user.companyId);
      },

      signOut: () => {
        set({ user: null, token: null, isAuthenticated: false, companyId: null });
        localStorage.removeItem('@AutoSync:token');
        localStorage.removeItem('@AutoSync:companyId');
      },

      setCompanyId: (id) => {
        set({ companyId: id });
        localStorage.setItem('@AutoSync:companyId', id);
      },
    }),
    {
      name: '@AutoSync:auth',
    }
  )
);
