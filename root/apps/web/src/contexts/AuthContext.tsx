import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'MECHANIC' | 'FINANCE' | 'RECEPTIONIST';
  companyId: string;
  branchId?: string | null;
}

interface AuthContextData {
  user: User | null;
  token: string | null;
  signed: boolean;
  loading: boolean;
  signIn(token: string, userData: User): void;
  signOut(): void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storagedUser = localStorage.getItem('@AutoSync:user');
    const storagedToken = localStorage.getItem('@AutoSync:token');

    if (storagedUser && storagedToken) {
      setUser(JSON.parse(storagedUser));
      setToken(storagedToken);
    }
    setLoading(false);
  }, []);

  const signIn = (newToken: string, userData: User) => {
    localStorage.setItem('@AutoSync:token', newToken);
    localStorage.setItem('@AutoSync:user', JSON.stringify(userData));
    localStorage.setItem('@AutoSync:companyId', userData.companyId);
    
    setToken(newToken);
    setUser(userData);
  };

  const signOut = () => {
    localStorage.clear();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      signed: !!token, 
      loading, 
      signIn, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
