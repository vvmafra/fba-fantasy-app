import axios from 'axios';
import { config } from './config';
import { authStorage, ensureValidToken } from './auth';

// Configuração base do cliente HTTP
export const apiClient = axios.create({
  baseURL: config.apiUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Log da URL base para debug
console.log('🔗 API Client configurado com URL:', config.apiUrl);

// Interceptor para requisições
apiClient.interceptors.request.use(
  async (config) => {
    // Verificar e renovar token se necessário
    await ensureValidToken();
    
    // Adicionar token de autenticação se disponível
    const token = authStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para respostas
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Tratamento global de erros
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      authStorage.clearAuth();
      window.location.href = '/login';
    }
    
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Tipos de resposta da API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Função helper para fazer requisições
export const apiRequest = {
  get: <T>(url: string, params?: any) => 
    apiClient.get<ApiResponse<T>>(url, { params }).then(res => res.data),
  
  post: <T>(url: string, data?: any) => 
    apiClient.post<ApiResponse<T>>(url, data).then(res => res.data),
  
  put: <T>(url: string, data?: any) => 
    apiClient.put<ApiResponse<T>>(url, data).then(res => res.data),
  
  patch: <T>(url: string, data?: any) => 
    apiClient.patch<ApiResponse<T>>(url, data).then(res => res.data),
  
  delete: <T>(url: string) => 
    apiClient.delete<ApiResponse<T>>(url).then(res => res.data),
}; 