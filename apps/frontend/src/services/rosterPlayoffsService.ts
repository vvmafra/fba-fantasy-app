import { apiRequest } from '@/lib/api';

// Tipos baseados no backend
export interface RosterPlayoffs {
  id: number;
  season_id: number;
  team_id: number;
  rotation_style: 'automatic' | 'manual';
  minutes_starting?: any; // JSONB
  minutes_bench?: any; // JSONB
  total_players_rotation?: number;
  age_preference?: number;
  game_style?: string;
  franchise_player_id?: number | null;
  offense_style?: string;
  defense_style?: string;
  created_at: string;
}

export interface CreateRosterPlayoffsRequest {
  season_id: number;
  team_id: number;
  rotation_style: 'automatic' | 'manual';
  minutes_starting?: any;
  minutes_bench?: any;
  total_players_rotation?: number;
  age_preference?: number;
  game_style?: string;
  franchise_player_id?: number | null;
  offense_style?: string;
  defense_style?: string;
}

export interface UpdateRosterPlayoffsRequest extends Partial<CreateRosterPlayoffsRequest> {
  id: number;
}

export interface RosterPlayoffsQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  season_id?: number;
  team_id?: number;
  rotation_style?: 'automatic' | 'manual';
  game_style?: string;
  offense_style?: string;
  defense_style?: string;
}

// Serviço de Roster Playoffs
export const rosterPlayoffsService = {
  // Teste de conexão
  testConnection: () =>
    apiRequest.get<any>('/roster-playoffs/test'),

  // Buscar todos os rosters playoffs com filtros
  getAllRosters: (params?: RosterPlayoffsQueryParams) =>
    apiRequest.get<RosterPlayoffs[]>('/roster-playoffs', params),

  // Buscar roster playoffs por ID
  getRosterById: (id: number) =>
    apiRequest.get<RosterPlayoffs>(`/roster-playoffs/${id}`),

  // Buscar roster playoffs por temporada
  getRosterBySeason: (seasonId: number) =>
    apiRequest.get<RosterPlayoffs>(`/roster-playoffs/season/${seasonId}`),

  // Buscar roster playoffs da temporada ativa
  getActiveSeasonRoster: () =>
    apiRequest.get<RosterPlayoffs>('/roster-playoffs/active'),

  // Buscar roster playoffs por time e temporada
  getRosterByTeamAndSeason: async (teamId: number, seasonId: number): Promise<RosterPlayoffs | null> => {
    try {
      const response = await apiRequest.get<RosterPlayoffs[]>(`/roster-playoffs?team_id=${teamId}&season_id=${seasonId}`);
      return response.data && response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
      return null;
    }
  },

  // Criar novo roster playoffs
  createRoster: (data: CreateRosterPlayoffsRequest) =>
    apiRequest.post<RosterPlayoffs>('/roster-playoffs', data),

  // Atualizar roster playoffs
  updateRoster: (id: number, data: Partial<CreateRosterPlayoffsRequest>) =>
    apiRequest.put<RosterPlayoffs>(`/roster-playoffs/${id}`, data),

  // Deletar roster playoffs
  deleteRoster: (id: number) =>
    apiRequest.delete<void>(`/roster-playoffs/${id}`),
}; 