// Configurações de autenticação
export const AUTH_CONFIG = {
  // Substitua pelo seu Client ID do Google
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || "SEU_CLIENT_ID_AQUI",
  
  // URL do backend
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || "http://localhost:3001",
  
  // Endpoints de autenticação
  ENDPOINTS: {
    GOOGLE_LOGIN: "/api/v1/auth/google-login",
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
  };
  error?: string;
}

export interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
} 