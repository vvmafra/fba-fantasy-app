import React, { createContext, useContext, useEffect, useState } from 'react';

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
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isLoading: true,
  teamId: undefined,
  updateUserTeam: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Exemplo: buscar usuário do localStorage ou de uma API
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userObj = JSON.parse(userStr);
      setUser(userObj);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const updateUserFromStorage = () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      }
    };
    window.addEventListener('storage', updateUserFromStorage);
    return () => window.removeEventListener('storage', updateUserFromStorage);
  }, []);

  // Listener para mudanças de time do usuário
  useEffect(() => {
    const handleUserTeamChanged = (event: CustomEvent) => {
      setUser(event.detail.user);
    };

    window.addEventListener('userTeamChanged', handleUserTeamChanged as EventListener);
    return () => window.removeEventListener('userTeamChanged', handleUserTeamChanged as EventListener);
  }, []);

  const updateUserTeam = (teamId: string | number, teamData?: any) => {
    if (user) {
      const updatedUser = { ...user, teamId, teamData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
