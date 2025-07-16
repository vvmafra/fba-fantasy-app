import { apiRequest } from '@/lib/api';

export interface LeagueCap {
  id: number;
  season_id: number;
  min_cap: number;
  max_cap: number;
  avg_cap: number;
  is_active: boolean;
  created_at: string;
  season_number?: number;
  year?: string;
}

export interface CreateLeagueCapData {
  season_id: number;
  min_cap: number;
  max_cap: number;
}

export interface UpdateLeagueCapData extends Partial<CreateLeagueCapData> {
  is_active?: boolean;
}

// Serviço de LeagueCap
export const leagueCapService = {
  // Buscar todos os league caps
  getAllLeagueCaps: () =>
    apiRequest.get<LeagueCap[]>('/league-cap'),

  // Buscar league cap ativo
  getActiveLeagueCap: () =>
    apiRequest.get<LeagueCap>('/league-cap/active'),

  // Buscar CAP médio atual da liga
  getCurrentLeagueAverageCap: () =>
    apiRequest.get<{ average_cap: number }>('/league-cap/current-average'),

  // Buscar league cap por ID
  getLeagueCapById: (id: number) =>
    apiRequest.get<LeagueCap>(`/league-cap/${id}`),

  // Criar novo league cap
  createLeagueCap: (data: CreateLeagueCapData) =>
    apiRequest.post<LeagueCap>('/league-cap', data),

  // Atualizar league cap
  updateLeagueCap: (id: number, data: UpdateLeagueCapData) =>
    apiRequest.put<LeagueCap>(`/league-cap/${id}`, data),

  // Deletar league cap
  deleteLeagueCap: (id: number) =>
    apiRequest.delete<void>(`/league-cap/${id}`),

  // Buscar último CAP (para calcular sugestão)
  getLastLeagueCap: () =>
    apiRequest.get<LeagueCap[]>('/league-cap'),
}; 