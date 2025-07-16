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

export interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

export interface RefreshTokenResponse {
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

// Chaves para localStorage
const AUTH_KEYS = {
  TOKEN: 'authToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  EXPIRES_AT: 'tokenExpiresAt',
  USER_ID: 'userId'
};

// Funções para gerenciar cache de autenticação
export const authStorage = {
  // Salvar dados de autenticação
  saveAuth: (data: GoogleLoginResponse['data']) => {
    const expiresAt = Date.now() + data.expiresIn;
    
    localStorage.setItem(AUTH_KEYS.TOKEN, data.token);
    localStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, data.refreshToken);
    localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(data.user));
    localStorage.setItem(AUTH_KEYS.EXPIRES_AT, expiresAt.toString());
    localStorage.setItem(AUTH_KEYS.USER_ID, data.user.id);
  },

  // Obter token atual
  getToken: (): string | null => {
    return localStorage.getItem(AUTH_KEYS.TOKEN);
  },

  // Obter refresh token
  getRefreshToken: (): string | null => {
    return localStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);
  },

  // Obter dados do usuário
  getUser: () => {
    const userStr = localStorage.getItem(AUTH_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  },

  // Obter ID do usuário
  getUserId: (): string | null => {
    return localStorage.getItem(AUTH_KEYS.USER_ID);
  },

  // Verificar se o token está expirado
  isTokenExpired: (): boolean => {
    const expiresAt = localStorage.getItem(AUTH_KEYS.EXPIRES_AT);
    if (!expiresAt) return true;
    
    // Considerar expirado se faltar menos de 5 minutos
    const buffer = 5 * 60 * 1000; // 5 minutos em millisegundos
    return Date.now() + buffer >= parseInt(expiresAt);
  },

  // Verificar se há dados de autenticação válidos
  hasValidAuth: (): boolean => {
    const token = localStorage.getItem(AUTH_KEYS.TOKEN);
    const refreshToken = localStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);
    const user = localStorage.getItem(AUTH_KEYS.USER);
    
    return !!(token && refreshToken && user && !authStorage.isTokenExpired());
  },

  // Limpar dados de autenticação
  clearAuth: () => {
    localStorage.removeItem(AUTH_KEYS.TOKEN);
    localStorage.removeItem(AUTH_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(AUTH_KEYS.USER);
    localStorage.removeItem(AUTH_KEYS.EXPIRES_AT);
    localStorage.removeItem(AUTH_KEYS.USER_ID);
  },

  // Atualizar dados de autenticação (após refresh)
  updateAuth: (data: RefreshTokenResponse['data']) => {
    const expiresAt = Date.now() + data.expiresIn;
    
    localStorage.setItem(AUTH_KEYS.TOKEN, data.token);
    localStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, data.refreshToken);
    localStorage.setItem(AUTH_KEYS.EXPIRES_AT, expiresAt.toString());
  }
};

// Função para fazer refresh do token
export const refreshAuthToken = async (): Promise<boolean> => {
  try {
    const userId = authStorage.getUserId();
    const refreshToken = authStorage.getRefreshToken();

    if (!userId || !refreshToken) {
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
      throw new Error('Falha no refresh do token');
    }

    const data: RefreshTokenResponse = await response.json();
    
    if (data.success && data.data) {
      authStorage.updateAuth(data.data);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Erro ao fazer refresh do token:', error);
    authStorage.clearAuth();
    return false;
  }
};

// Função para verificar e renovar token automaticamente
export const ensureValidToken = async (): Promise<boolean> => {
  if (!authStorage.hasValidAuth()) {
    return false;
  }

  if (authStorage.isTokenExpired()) {
    return await refreshAuthToken();
  }

  return true;
}; 