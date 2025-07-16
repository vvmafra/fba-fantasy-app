import { apiRequest } from '@/lib/api';

export interface Season {
  id: number;
  season_number: number;
  total_seasons: number;
  is_active: boolean;
  created_at: string;
  year: string;
}

export interface CreateSeasonData {
  season_number: number;
  total_seasons: number;
  is_active: boolean;
  year: string;
}

export interface UpdateSeasonData extends Partial<CreateSeasonData> {}

// Serviço de Seasons
export const seasonService = {
  // Buscar todas as temporadas
  getAllSeasons: () =>
    apiRequest.get<Season[]>('/seasons'),

  // Buscar temporada por ID
  getSeasonById: (id: number) =>
    apiRequest.get<Season>(`/seasons/${id}`),

  // Buscar todas as temporadas a partir da ativa
  getSeasonsFromActive: () =>
    apiRequest.get<Season[]>('/seasons/active/seasons'),

  // Buscar temporada ativa
  getActiveSeason: () =>
    apiRequest.get<Season>('/seasons/active'),

  // Criar nova temporada
  createSeason: (data: CreateSeasonData) =>
    apiRequest.post<Season>('/seasons', data),

  // Atualizar temporada
  updateSeason: (id: number, data: UpdateSeasonData) =>
    apiRequest.put<Season>(`/seasons/${id}`, data),

  // Deletar temporada
  deleteSeason: (id: number) =>
    apiRequest.delete<void>(`/seasons/${id}`),

  // Avançar para próxima temporada
  advanceToNextSeason: () =>
    apiRequest.post<Season>('/seasons/advance-next'),

  // Voltar para temporada anterior
  goBackToPreviousSeason: () =>
    apiRequest.post<Season>('/seasons/go-back'),

  // Alterar temporada ativa
  changeActiveSeason: (seasonId: number) =>
    apiRequest.post<Season>(`/seasons/${seasonId}/activate`),
}; 