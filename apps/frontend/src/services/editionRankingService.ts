import { apiRequest } from '@/lib/api';

export interface EditionRankingTeam {
  team_id: number;
  team_name: string;
  team_abbreviation: string;
  owner_name?: string | null;
  total_points: number;
  standings_points: number;
  awards_points: number;
  seasons_count: number;
  championships: number;
  finals_appearances: number;
  conference_finals: number;
  playoff_appearances: number;
}

// Serviço de Edition Ranking
export const editionRankingService = {
  // Buscar ranking de edição geral
  getEditionRanking: () =>
    apiRequest.get<EditionRankingTeam[]>('/edition-ranking'),

  // Buscar ranking de edição por temporada
  getEditionRankingBySeason: (seasonId: number) =>
    apiRequest.get<EditionRankingTeam[]>(`/edition-ranking/season/${seasonId}`),

  // Buscar ranking de um time específico
  getTeamEditionRanking: (teamId: number) =>
    apiRequest.get<EditionRankingTeam>(`/edition-ranking/team/${teamId}`),
}; 