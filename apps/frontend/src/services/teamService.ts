import { apiRequest } from '@/lib/api';

// Tipos baseados no backend real
export interface Team {
  id: number;
  name: string;
  abbreviation: string;
  owner_id: number | null;
  owner_name?: string | null;
  created_at?: string;
  updated_at?: string;
  player_order?: {
    starters: number[];
    bench: number[];
    last_updated?: string;
  } | null;
  cap?: number; // CAP (soma dos 8 maiores overalls)
  logo_path?: string | null;
  conference?: string | null;
}

export interface CreateTeamData {
  name: string;
  abbreviation: string;
  owner_id?: number | null;
  player_order?: {
    starters: number[];
    bench: number[];
    last_updated?: string;
  };
}

export interface UpdateTeamData extends Partial<CreateTeamData> {}

export interface TeamQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  owner_id?: number;
}

// Serviço de Teams
export const teamService = {
  // Buscar todos os times com filtros
  getAllTeams: (params?: TeamQueryParams) =>
    apiRequest.get<Team[]>('/teams', params),

  // Buscar time por ID
  getTeamById: (id: number) =>
    apiRequest.get<Team>(`/teams/${id}`),

  // Buscar times do usuário autenticado
  getMyTeams: () =>
    apiRequest.get<Team[]>('/teams/my-teams'),

  // Criar novo time
  createTeam: (data: CreateTeamData) =>
    apiRequest.post<Team>('/teams', data),

  // Atualizar time
  updateTeam: (id: number, data: UpdateTeamData) =>
    apiRequest.put<Team>(`/teams/${id}`, data),

  // Deletar time
  deleteTeam: (id: number) =>
    apiRequest.delete<void>(`/teams/${id}`),

  // Buscar times com Power Ranking (CAP)
  getTeamsWithCAP: async (): Promise<Team[]> => {
    const response = await apiRequest.get<Team[]>('/teams/ranking');
    return response.data;
  },
}; 