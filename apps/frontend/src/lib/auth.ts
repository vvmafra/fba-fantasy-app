// Configurações de autenticação
export const AUTH_CONFIG = {
  // Substitua pelo seu Client ID do Google
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || "SEU_CLIENT_ID_AQUI",
  
  // URL do backend
  BACKEND_URL: import.meta.env.VITE_API_URL || "http://localhost:3001",
  
  // Endpoints de autenticação
  ENDPOINTS: {
    GOOGLE_LOGIN: "/auth/google-login",
    REFRESH_TOKEN: "/auth/refresh-token",
  }
};

// Tipos para autenticação
export interface GoogleLoginResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      name: string;
      teamId?: number;
    };
    token: string;
    refreshToken: string;
    expiresIn: number;
  };
  error?: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  data: {
    token: string;
    refreshToken: string;
    expiresIn: number;
  };
  error?: string;
}

export interface GoogleCredentialResponse {
  credential: string;
}

// Chaves para localStorage
const AUTH_KEYS = {
  TOKEN: 'authToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  EXPIRES_AT: 'tokenExpiresAt',
  USER_ID: 'userId'
};

// Função para verificar se localStorage está disponível
const isLocalStorageAvailable = (): boolean => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    console.warn('⚠️ localStorage não disponível:', e);
    return false;
  }
};

// Funções para gerenciar cache de autenticação
export const authStorage = {
  // Salvar dados de autenticação
  saveAuth: (data: GoogleLoginResponse['data']) => {
    try {
      const expiresAt = Date.now() + data.expiresIn;
      
      if (isLocalStorageAvailable()) {
        localStorage.setItem(AUTH_KEYS.TOKEN, data.token);
        localStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, data.refreshToken);
        localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(data.user));
        localStorage.setItem(AUTH_KEYS.EXPIRES_AT, expiresAt.toString());
        localStorage.setItem(AUTH_KEYS.USER_ID, data.user.id);
      } else {
        console.warn('⚠️ localStorage não disponível, dados não salvos');
      }
    } catch (error) {
      console.error('🚨 Erro ao salvar dados de autenticação:', error);
    }
  },

  // Obter token atual
  getToken: (): string | null => {
    try {
      if (isLocalStorageAvailable()) {
        return localStorage.getItem(AUTH_KEYS.TOKEN);
      }
      return null;
    } catch (error) {
      console.error('🚨 Erro ao obter token:', error);
      return null;
    }
  },

  // Obter refresh token
  getRefreshToken: (): string | null => {
    try {
      if (isLocalStorageAvailable()) {
        return localStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);
      }
      return null;
    } catch (error) {
      console.error('🚨 Erro ao obter refresh token:', error);
      return null;
    }
  },

  // Obter dados do usuário
  getUser: () => {
    try {
      if (isLocalStorageAvailable()) {
        const userStr = localStorage.getItem(AUTH_KEYS.USER);
        return userStr ? JSON.parse(userStr) : null;
      }
      return null;
    } catch (error) {
      console.error('🚨 Erro ao obter dados do usuário:', error);
      return null;
    }
  },

  // Obter ID do usuário
  getUserId: (): string | null => {
    try {
      if (isLocalStorageAvailable()) {
        return localStorage.getItem(AUTH_KEYS.USER_ID);
      }
      return null;
    } catch (error) {
      console.error('🚨 Erro ao obter ID do usuário:', error);
      return null;
    }
  },

  // Verificar se o token está expirado
  isTokenExpired: (): boolean => {
    try {
      if (!isLocalStorageAvailable()) return true;
      
      const expiresAt = localStorage.getItem(AUTH_KEYS.EXPIRES_AT);
      if (!expiresAt) return true;
      
      // Considerar expirado se faltar menos de 10 minutos
      const buffer = 15 * 60 * 1000; // 15 minutos em millisegundos
      const isExpired = Date.now() + buffer >= parseInt(expiresAt);
      
      return isExpired;
    } catch (error) {
      console.error('🚨 Erro ao verificar expiração do token:', error);
      return true;
    }
  },

  // Verificar se há dados de autenticação válidos
  hasValidAuth: (): boolean => {
    try {
      if (!isLocalStorageAvailable()) return false;
      
      const token = localStorage.getItem(AUTH_KEYS.TOKEN);
      const refreshToken = localStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);
      const user = localStorage.getItem(AUTH_KEYS.USER);
      
      const hasData = !!(token && refreshToken && user);
      const notExpired = !authStorage.isTokenExpired();
      
      return hasData && notExpired;
    } catch (error) {
      console.error('🚨 Erro ao verificar autenticação válida:', error);
      return false;
    }
  },

  // Limpar dados de autenticação
  clearAuth: () => {
    try {
      if (isLocalStorageAvailable()) {
        localStorage.removeItem(AUTH_KEYS.TOKEN);
        localStorage.removeItem(AUTH_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(AUTH_KEYS.USER);
        localStorage.removeItem(AUTH_KEYS.EXPIRES_AT);
        localStorage.removeItem(AUTH_KEYS.USER_ID);
      }
    } catch (error) {
      console.error('🚨 Erro ao limpar dados de autenticação:', error);
    }
  },

  // Atualizar dados de autenticação (após refresh)
  updateAuth: (data: RefreshTokenResponse['data']) => {
    try {
      const expiresAt = Date.now() + data.expiresIn;
      
      if (isLocalStorageAvailable()) {
        localStorage.setItem(AUTH_KEYS.TOKEN, data.token);
        localStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, data.refreshToken);
        localStorage.setItem(AUTH_KEYS.EXPIRES_AT, expiresAt.toString());
      }
    } catch (error) {
      console.error('🚨 Erro ao atualizar dados de autenticação:', error);
    }
  }
};

// Função para fazer refresh do token
export const refreshAuthToken = async (): Promise<boolean> => {
  try {
    const userId = authStorage.getUserId();
    const refreshToken = authStorage.getRefreshToken();

    if (!userId || !refreshToken) {
      console.error('❌ Dados insuficientes para renovar token');
      return false;
    }

    const response = await fetch(`${AUTH_CONFIG.BACKEND_URL}${AUTH_CONFIG.ENDPOINTS.REFRESH_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: parseInt(userId),
        refreshToken
      }),
    });

    if (!response.ok) {
      console.error('❌ Falha na resposta do servidor:', response.status);
      throw new Error('Falha no refresh do token');
    }

    const data: RefreshTokenResponse = await response.json();
    
    if (data.success && data.data) {
      authStorage.updateAuth(data.data);
      return true;
    }

    console.error('❌ Resposta inválida do servidor');
    return false;
  } catch (error) {
    console.error('🚨 Erro ao fazer refresh do token:', error);
    authStorage.clearAuth();
    return false;
  }
};

// Função para verificar e renovar token automaticamente
export const ensureValidToken = async (): Promise<boolean> => {
  try {
    
    if (!authStorage.hasValidAuth()) {
      return false;
    }

    if (authStorage.isTokenExpired()) {
      return await refreshAuthToken();
    }

    return true;
  } catch (error) {
    console.error('🚨 Erro ao verificar token:', error);
    return false;
  }
}; 