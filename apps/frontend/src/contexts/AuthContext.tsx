import React, { createContext, useContext, useEffect, useState } from 'react';
import { authStorage, ensureValidToken } from '@/lib/auth';
import { useAuthPersistence } from '@/hooks/useAuthPersistence';

type User = {
  id: string;
  email: string;
  name?: string;
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
  refreshUserData: () => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isLoading: true,
  teamId: undefined,
  updateUserTeam: () => {},
  refreshUserData: async () => {},
  logout: () => {},
  checkAuth: async () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Usar o hook de persistência
  useAuthPersistence();

  // Função para buscar dados atualizados do usuário do servidor
  const refreshUserData = async (): Promise<void> => {
    try {
      console.log('🔄 Atualizando dados do usuário...');
      
      const token = authStorage.getToken();
      if (!token) {
        console.log('❌ Sem token para atualizar dados');
        return;
      }

      // Fazer requisição para buscar dados atualizados do usuário
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          console.log('✅ Dados do usuário atualizados:', data.data);
          
          // Atualizar dados no localStorage
          const currentUserData = authStorage.getUser();
          if (currentUserData) {
            const updatedUserData = { ...currentUserData, ...data.data };
            localStorage.setItem('user', JSON.stringify(updatedUserData));
            
            // Atualizar estado
            setUser(updatedUserData);
          }
        }
      } else {
        console.log('❌ Falha ao atualizar dados do usuário:', response.status);
      }
    } catch (error) {
      console.error('🚨 Erro ao atualizar dados do usuário:', error);
    }
  };

  // Função para verificar autenticação
  const checkAuth = async (): Promise<boolean> => {
    try {
      console.log('🔍 Verificando autenticação...');
      
      // Primeiro, verificar se há dados no localStorage
      const hasStoredAuth = authStorage.hasValidAuth();
      console.log('📦 Dados de auth no localStorage:', hasStoredAuth);
      
      if (!hasStoredAuth) {
        console.log('❌ Sem dados de autenticação válidos');
        return false;
      }

      // Verificar se o token está expirado e tentar renovar
      const isValid = await ensureValidToken();
      console.log('✅ Token válido:', isValid);
      
      if (isValid) {
        const userData = authStorage.getUser();
        if (userData) {
          console.log('👤 Usuário encontrado:', userData.email);
          setUser(userData);
          
          // Verificar se os dados do usuário estão atualizados
          await refreshUserData();
          
          return true;
        }
      }
      
      console.log('❌ Falha na verificação de autenticação');
      return false;
    } catch (error) {
      console.error('🚨 Erro ao verificar autenticação:', error);
      return false;
    }
  };

  // Função para logout
  const logout = () => {
    console.log('🚪 Fazendo logout...');
    authStorage.clearAuth();
    setUser(null);
    window.location.href = '/';
  };

  // Verificar autenticação na inicialização
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🚀 Inicializando autenticação...');
      setIsLoading(true);
      
      try {
        await checkAuth();
      } catch (error) {
        console.error('🚨 Erro na inicialização da autenticação:', error);
      } finally {
        setIsLoading(false);
      }
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

  // Verificar token periodicamente (a cada 10 minutos em vez de 5)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (user) {
        console.log('⏰ Verificação periódica de autenticação...');
        await checkAuth();
      }
    }, 10 * 60 * 1000); // 10 minutos

    return () => clearInterval(interval);
  }, [user]);

  // Listener para quando a aplicação volta ao foco (útil para PWA)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && user) {
        console.log('👁️ Aplicação voltou ao foco, verificando autenticação...');
        await checkAuth();
      }
    };

    const handleFocus = async () => {
      if (user) {
        console.log('🎯 Janela ganhou foco, verificando autenticação...');
        await checkAuth();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
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
        refreshUserData,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
