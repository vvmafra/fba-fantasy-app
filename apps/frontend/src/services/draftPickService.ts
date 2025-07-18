import { apiRequest } from '@/lib/api';

export interface DraftPick {
  id: number;
  season_id: number;
  player_id?: number | null;
  team_id: number;
  pick_number: number;
  is_added_to_2k: boolean;
  created_at: string;
  updated_at: string;
  team_name?: string;
  team_abbreviation?: string;
  actual_player_name?: string;
  actual_player_position?: string;
  actual_player_age?: number;
  actual_player_ovr?: number;
}

export interface CreateDraftPickData {
  season_id: number;
  team_id: number;
  pick_number: number;
}

export interface UpdateDraftPickData {
  season_id?: number;
  team_id?: number;
  pick_number?: number;
  is_added_to_2k?: boolean;
  player_id?: number | null;
}

export interface AddPlayerToDraftPickData {
  player_id: number;
}

export interface DraftPickQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  season_id?: number;
  team_id?: number;
  is_added_to_2k?: boolean;
}

// Serviço de Draft Picks
export const draftPickService = {
  // Buscar todos os draft picks
  getAllDraftPicks: (params?: DraftPickQueryParams) =>
    apiRequest.get<{ data: DraftPick[]; pagination: any }>('/draft-picks', params),

  // Buscar draft pick por ID
  getDraftPickById: (id: number) =>
    apiRequest.get<DraftPick>(`/draft-picks/${id}`),

  // Buscar draft picks por temporada
  getDraftPicksBySeason: (seasonId: number) =>
    apiRequest.get<DraftPick[]>(`/draft-picks/season/${seasonId}`),

  // Criar novo draft pick
  createDraftPick: (data: CreateDraftPickData) =>
    apiRequest.post<DraftPick>('/draft-picks', data),

  // Atualizar draft pick
  updateDraftPick: (id: number, data: UpdateDraftPickData) =>
    apiRequest.put<DraftPick>(`/draft-picks/${id}`, data),

  // Deletar draft pick
  deleteDraftPick: (id: number) =>
    apiRequest.delete<void>(`/draft-picks/${id}`),

  // Alternar status is_added_to_2k
  toggleAddedTo2k: (id: number) =>
    apiRequest.post<DraftPick>(`/draft-picks/${id}/toggle-2k`),

  // Adicionar jogador ao draft pick
  addPlayerToDraftPick: (id: number, data: AddPlayerToDraftPickData) =>
    apiRequest.post<DraftPick>(`/draft-picks/${id}/add-player`, data),

  // Buscar próximo número de pick
  getNextPickNumber: (seasonId: number) =>
    apiRequest.get<{ next_pick_number: number }>(`/draft-picks/next-pick/${seasonId}`),

  // Criar jogador e vincular ao draft pick
  createPlayerAndAddToDraftPick: (id: number, data: any) =>
    apiRequest.post<any>(`/draft-picks/${id}/create-player`, data),

}; 