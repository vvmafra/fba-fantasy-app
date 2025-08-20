import { apiRequest } from '../lib/api';

export interface Waiver {
  id: number;
  team_id: number;
  player_id: number;
  season_id: number;
  created_at: string;
  player_name?: string;
  player_overall?: number;
  player_age?: number;
  team_name?: string;
  season_name?: string;
}

export interface CreateWaiverData {
  playerId: number;
  teamId: number;
  seasonId: number;
}

export interface UpdateWaiverData {
  team_id?: number;
  player_id?: number;
  season_id?: number;
}

export const waiverService = {
  // Adicionar jogador dispensado aos waivers
  addReleasedPlayer: (data: CreateWaiverData) =>
    apiRequest.post<Waiver>('/waivers/add-released-player', data),

  // Obter todos os waivers
  getAllWaivers: () =>
    apiRequest.get<Waiver[]>('/waivers'),

  // Obter waivers por temporada
  getWaiversBySeason: (seasonId: number) =>
    apiRequest.get<Waiver[]>(`/waivers/season/${seasonId}`),

  // Obter waivers por time
  getWaiversByTeam: (teamId: number) =>
    apiRequest.get<Waiver[]>(`/waivers/team/${teamId}`),

  // Contar waivers por time e temporada
  countWaiversByTeamAndSeason: (teamId: number, seasonId: number) =>
    apiRequest.get<{ count: number }>(`/waivers/count/${teamId}/${seasonId}`),

  // Obter waiver específico
  getWaiverById: (id: number) =>
    apiRequest.get<Waiver>(`/waivers/${id}`),

  // Atualizar waiver
  updateWaiver: (id: number, data: UpdateWaiverData) =>
    apiRequest.put<Waiver>(`/waivers/${id}`, data),

  // Deletar waiver
  deleteWaiver: (id: number) =>
    apiRequest.delete<void>(`/waivers/${id}`),

  // Obter waivers disponíveis para claim
  getAvailableWaivers: (seasonId: number) =>
    apiRequest.get<Waiver[]>(`/waivers/season/${seasonId}`),
};
