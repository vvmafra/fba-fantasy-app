import { apiRequest } from '@/lib/api';

// Tipos baseados no backend
export interface TeamStanding {
  id: number;
  season_id: number;
  team_id: number;
  final_position: number; // 1-30 (temporada regular)
  seed: number; // 1-15 (conferência)
  elimination_round: number; // 0=não foi aos playoffs, 1=1ª rodada, 2=2ª rodada, 3=final conf, 4=final, 5=campeão
  created_at: string;
}

export interface TeamStandingWithDetails extends TeamStanding {
  team: {
    id: number;
    name: string;
    abbreviation: string;
    conference: string;
  };
  season: {
    id: number;
    name: string; // season_number from backend
  };
}

export interface CreateTeamStandingData {
  season_id: number;
  team_id: number;
  final_position: number;
  seed: number;
  elimination_round: number;
}

export interface UpdateTeamStandingData extends Partial<CreateTeamStandingData> {
  id: number;
}

// Serviço de Team Standings
export const teamStandingService = {
  // Buscar todos os standings
  getAllStandings: () =>
    apiRequest.get<TeamStandingWithDetails[]>('/team-standings'),

  // Buscar standings por temporada
  getStandingsBySeason: (seasonId: number) =>
    apiRequest.get<TeamStandingWithDetails[]>(`/team-standings/season/${seasonId}`),

  // Buscar standings por time
  getStandingsByTeam: (teamId: number) =>
    apiRequest.get<TeamStandingWithDetails[]>(`/team-standings/team/${teamId}`),

  // Buscar standing específico
  getStandingById: (id: number) =>
    apiRequest.get<TeamStandingWithDetails>(`/team-standings/${id}`),

  // Buscar campeões por temporada
  getChampionsBySeason: (seasonId: number) =>
    apiRequest.get<TeamStandingWithDetails[]>(`/team-standings/season/${seasonId}/champions`),

  // Buscar times dos playoffs por temporada
  getPlayoffTeamsBySeason: (seasonId: number) =>
    apiRequest.get<TeamStandingWithDetails[]>(`/team-standings/season/${seasonId}/playoffs`),

  // Criar novo standing
  createStanding: (data: CreateTeamStandingData) =>
    apiRequest.post<TeamStanding>('/team-standings', data),

  // Atualizar standing
  updateStanding: (data: UpdateTeamStandingData) =>
    apiRequest.put<TeamStanding>(`/team-standings/${data.id}`, data),

  // Deletar standing
  deleteStanding: (id: number) =>
    apiRequest.delete<void>(`/team-standings/${id}`),

  // Criar ou atualizar múltiplos standings
  upsertManyStandings: (standings: CreateTeamStandingData[]) =>
    apiRequest.post<TeamStanding[]>('/team-standings/bulk', { standings }),

  // Utilitários para interpretar elimination_round
  getEliminationRoundText: (eliminationRound: number): string => {
    switch (eliminationRound) {
      case 0: return 'Não foi aos playoffs';
      case 1: return '1ª Rodada';
      case 2: return '2ª Rodada';
      case 3: return 'Final de Conferência';
      case 4: return 'Final';
      case 5: return 'Campeão';
      default: return 'Desconhecido';
    }
  },

  getEliminationRoundColor: (eliminationRound: number): string => {
    switch (eliminationRound) {
      case 0: return 'bg-gray-100 text-gray-800';
      case 1: return 'bg-red-100 text-red-800';
      case 2: return 'bg-orange-100 text-orange-800';
      case 3: return 'bg-yellow-100 text-yellow-800';
      case 4: return 'bg-blue-100 text-blue-800';
      case 5: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  },

  // Verificar se o time foi campeão
  isChampion: (eliminationRound: number): boolean => {
    return eliminationRound === 5;
  },

  // Verificar se o time foi aos playoffs
  wentToPlayoffs: (eliminationRound: number): boolean => {
    return eliminationRound > 0;
  },
}; 