import React, { createContext, useContext, useEffect, useState } from 'react';
import { authStorage, ensureValidToken } from '@/lib/auth';

type User = {
  id: string;
  email: string;
  role: string;
  teamId?: string | number; // pode ser string ou number, dependendo do seu uso
  teamData?: any; // dados do time selecionado
  // outros campos se quiser
};

type AuthContextType = {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  teamId: string | number | undefined;
  updateUserTeam: (teamId: string | number, teamData?: any) => void;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isLoading: true,
  teamId: undefined,
  updateUserTeam: () => {},
  logout: () => {},
  checkAuth: async () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Função para verificar autenticação
  const checkAuth = async (): Promise<boolean> => {
    try {
      const isValid = await ensureValidToken();
      if (isValid) {
        const userData = authStorage.getUser();
        if (userData) {
          setUser(userData);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      return false;
    }
  };

  // Função para logout
  const logout = () => {
    authStorage.clearAuth();
    setUser(null);
    window.location.href = '/';
  };

  // Verificar autenticação na inicialização
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      await checkAuth();
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Listener para mudanças de time do usuário
  useEffect(() => {
    const handleUserTeamChanged = (event: CustomEvent) => {
      setUser(event.detail.user);
    };

    window.addEventListener('userTeamChanged', handleUserTeamChanged as EventListener);
    return () => window.removeEventListener('userTeamChanged', handleUserTeamChanged as EventListener);
  }, []);

  // Verificar token periodicamente (a cada 5 minutos)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (user) {
        await checkAuth();
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [user]);

  const updateUserTeam = (teamId: string | number, teamData?: any) => {
    if (user) {
      const updatedUser = { ...user, teamId, teamData };
      setUser(updatedUser);
      
      // Atualizar no localStorage
      const userData = authStorage.getUser();
      if (userData) {
        const updatedUserData = { ...userData, teamId, teamData };
        localStorage.setItem('user', JSON.stringify(updatedUserData));
      }
      
      // Disparar evento customizado para notificar mudanças
      window.dispatchEvent(new CustomEvent('userTeamChanged', { detail: { user: updatedUser } }));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: user?.role === 'admin',
        isLoading,
        teamId: user?.teamId,
        updateUserTeam,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
