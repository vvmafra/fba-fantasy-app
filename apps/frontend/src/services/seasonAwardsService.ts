import { apiRequest } from '@/lib/api';

export interface SeasonAwards {
  id: number;
  season_id: number;
  mvp_player_id?: number | null;
  mvp_team_id?: number | null;
  roy_player_id?: number | null;
  roy_team_id?: number | null;
  smoy_player_id?: number | null;
  smoy_team_id?: number | null;
  dpoy_player_id?: number | null;
  dpoy_team_id?: number | null;
  mip_player_id?: number | null;
  mip_team_id?: number | null;
  coy_user_id?: number | null;
  coy_team_id?: number | null;
  created_at: string;
//   updated_at: string;
}

export interface SeasonAwardsWithDetails extends SeasonAwards {
  season?: {
    id: number;
    season_number: number;
    year: string;
  };
  mvp_player?: {
    id: number;
    name: string;
    position: string;
    ovr: number;
  } | null;
  mvp_team?: {
    id: number;
    name: string;
    abbreviation: string;
  } | null;
  roy_player?: {
    id: number;
    name: string;
    position: string;
    ovr: number;
  } | null;
  roy_team?: {
    id: number;
    name: string;
    abbreviation: string;
  } | null;
  smoy_player?: {
    id: number;
    name: string;
    position: string;
    ovr: number;
  } | null;
  smoy_team?: {
    id: number;
    name: string;
    abbreviation: string;
  } | null;
  dpoy_player?: {
    id: number;
    name: string;
    position: string;
    ovr: number;
  } | null;
  dpoy_team?: {
    id: number;
    name: string;
    abbreviation: string;
  } | null;
  mip_player?: {
    id: number;
    name: string;
    position: string;
    ovr: number;
  } | null;
  mip_team?: {
    id: number;
    name: string;
    abbreviation: string;
  } | null;
  coy_user?: {
    id: number;
    name: string;
    email: string;
  } | null;
  coy_team?: {
    id: number;
    name: string;
    abbreviation: string;
  } | null;
}

export interface CreateSeasonAwardsData {
  season_id: number;
  mvp_player_id?: number | null;
  mvp_team_id?: number | null;
  roy_player_id?: number | null;
  roy_team_id?: number | null;
  smoy_player_id?: number | null;
  smoy_team_id?: number | null;
  dpoy_player_id?: number | null;
  dpoy_team_id?: number | null;
  mip_player_id?: number | null;
  mip_team_id?: number | null;
  coy_user_id?: number | null;
  coy_team_id?: number | null;
}

export interface UpdateSeasonAwardsData extends Partial<CreateSeasonAwardsData> {
  id: number;
}

// Serviço de Season Awards
export const seasonAwardsService = {
  // Buscar todas as premiações
  getAllSeasonAwards: () =>
    apiRequest.get<SeasonAwardsWithDetails[]>('/season-awards'),

  // Buscar premiação por temporada
  getSeasonAwardsBySeason: (seasonId: number) =>
    apiRequest.get<SeasonAwardsWithDetails>(`/season-awards/season/${seasonId}`),

  // Buscar premiação por ID
  getSeasonAwardsById: (id: number) =>
    apiRequest.get<SeasonAwardsWithDetails>(`/season-awards/${id}`),

  // Criar nova premiação
  createSeasonAwards: (data: CreateSeasonAwardsData) =>
    apiRequest.post<SeasonAwards>('/season-awards', data),

  // Atualizar premiação
  updateSeasonAwards: (id: number, data: Partial<CreateSeasonAwardsData>) =>
    apiRequest.put<SeasonAwards>(`/season-awards/${id}`, data),

  // Deletar premiação
  deleteSeasonAwards: (id: number) =>
    apiRequest.delete<void>(`/season-awards/${id}`),
}; 