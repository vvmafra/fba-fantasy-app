import { apiRequest } from '@/lib/api';

// Tipos baseados no backend
export interface RosterSeason {
  id: number;
  season_id: number;
  team_id: number;
  rotation_style: 'automatic' | 'manual';
  minutes_starting?: any; // JSONB
  minutes_bench?: any; // JSONB
  gleague1_player_id?: number | null;
  gleague2_player_id?: number | null;
  total_players_rotation?: number;
  age_preference?: number;
  game_style?: string;
  franchise_player_id?: number | null;
  offense_style?: string;
  defense_style?: string;
  offensive_tempo?: 'No preference' | 'Patient Offense' | 'Average Tempo' | 'Shoot at Will' | null;
  offensive_rebounding?: 'Limit Transition' | 'No preference' | 'Crash Offensive Glass' | 'Some Crash, Others Get Back' | null;
  defensive_aggression?: 'Play Physical Defense' | 'No preference' | 'Conservative Defense' | 'Neutral Defensive Aggression' | null;
  defensive_rebounding?: 'Run in Transition' | 'Crash Defensive Glass' | 'Some Crash, Others Run' | 'No preference' | null;
  rotation_made?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CreateRosterSeasonRequest {
  season_id: number;
  team_id: number;
  rotation_style: 'automatic' | 'manual';
  minutes_starting?: any;
  minutes_bench?: any;
  gleague1_player_id?: number | null;
  gleague2_player_id?: number | null;
  total_players_rotation?: number;
  age_preference?: number;
  game_style?: string;
  franchise_player_id?: number | null;
  offense_style?: string;
  defense_style?: string;
  offensive_tempo?: 'No preference' | 'Patient Offense' | 'Average Tempo' | 'Shoot at Will' | null;
  offensive_rebounding?: 'Limit Transition' | 'No preference' | 'Crash Offensive Glass' | 'Some Crash, Others Get Back' | null;
  defensive_aggression?: 'Play Physical Defense' | 'No preference' | 'Conservative Defense' | 'Neutral Defensive Aggression' | null;
  defensive_rebounding?: 'Run in Transition' | 'Crash Defensive Glass' | 'Some Crash, Others Run' | 'No preference' | null;
}

export interface UpdateRosterSeasonRequest extends Partial<CreateRosterSeasonRequest> {
  id: number;
}

export interface RosterQueryParams {
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

// Serviço de Roster
export const rosterService = {
  // Teste de conexão
  testConnection: () =>
    apiRequest.get<any>('/roster/test'),

  // Buscar todos os rosters com filtros
  getAllRosters: (params?: RosterQueryParams) =>
    apiRequest.get<RosterSeason[]>('/roster', params),

  // Buscar roster por ID
  getRosterById: (id: number) =>
    apiRequest.get<RosterSeason>(`/roster/${id}`),

  // Buscar roster por temporada
  getRosterBySeason: (seasonId: number) =>
    apiRequest.get<RosterSeason>(`/roster/season/${seasonId}`),

  // Buscar roster da temporada ativa
  getActiveSeasonRoster: () =>
    apiRequest.get<RosterSeason>('/roster/active'),

  // Buscar todos os rosters com detalhes
  getAllRostersWithDetails: (params?: { season_id?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }) =>
    apiRequest.get<any[]>('/roster/with-details', params),

  // Buscar roster por time e temporada
  getRosterByTeamAndSeason: async (teamId: number, seasonId: number): Promise<RosterSeason | null> => {
    try {
      const response = await apiRequest.get<RosterSeason[]>(`/roster?team_id=${teamId}&season_id=${seasonId}`);
      return response.data && response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
      return null;
    }
  },

  // Criar novo roster
  createRoster: (data: CreateRosterSeasonRequest) =>
    apiRequest.post<RosterSeason>('/roster', data),

  // Atualizar roster
  updateRoster: (id: number, data: Partial<CreateRosterSeasonRequest>) =>
    apiRequest.put<RosterSeason>(`/roster/${id}`, data),

  // Deletar roster
  deleteRoster: (id: number) =>
    apiRequest.delete<void>(`/roster/${id}`),

  // Atualizar apenas o status de rotation_made
  updateRotationMade: (id: number, rotationMade: boolean) =>
    apiRequest.patch<RosterSeason>(`/roster/${id}/rotation-made`, { rotation_made: rotationMade }),
}; 