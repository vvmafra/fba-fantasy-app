import React, { createContext, useContext, useEffect, useState } from 'react';

type User = {
  id: string;
  email: string;
  role: string;
  teamId?: string | number; // pode ser string ou number, dependendo do seu uso
  // outros campos se quiser
};

type AuthContextType = {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isLoading: true,
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

    console.log(user);
  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: user?.role === 'admin',
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
