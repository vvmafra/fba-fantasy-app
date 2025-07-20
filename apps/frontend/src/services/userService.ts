import { apiRequest } from '@/lib/api';

// Tipos baseados no backend real
export interface User {
  id: number;
  name: string;
  email: string;
  google_id?: string | null;
  role: 'admin' | 'user';
  refresh_token?: string | null;
  token_updated_at?: string | null;
}

export interface CreateUserData {
  name: string;
  email: string;
  role?: 'admin' | 'user';
}

export interface UpdateUserData extends Partial<CreateUserData> {}

export interface UserQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc';
  name?: string;
  email?: string;
  role?: 'admin' | 'user';
}

// Serviço de Users
export const userService = {
  // Buscar todos os usuários com filtros
  getAllUsers: (params?: UserQueryParams) =>
    apiRequest.get<User[]>('/users', params),

  // Buscar usuário por ID
  getUserById: (id: number) =>
    apiRequest.get<User>(`/users/${id}`),

  // Criar novo usuário
  createUser: (data: CreateUserData) =>
    apiRequest.post<User>('/users', data),

  // Atualizar usuário
  updateUser: (id: number, data: UpdateUserData) =>
    apiRequest.put<User>(`/users/${id}`, data),

  // Deletar usuário
  deleteUser: (id: number) =>
    apiRequest.delete<void>(`/users/${id}`),
}; 