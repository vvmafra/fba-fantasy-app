import { apiRequest } from '@/lib/api';

// Tipos baseados no backend real
export interface Player {
  id: number;
  name: string;
  position: string;
  age: number;
  ovr: number;
  // Campos de estatísticas específicos
  ins: string;
  mid: string;
  "3pt": string;
  ins_d: string;
  per_d: string;
  plmk: string;
  reb: string;
  phys: string;
  iq: string;
  pot: string;
  team_id?: number | null;
  source?: 'ocr' | 'manual';
  created_at: string;
}

export interface CreatePlayerData {
  name: string;
  position: string;
  age: number;
  ovr: number;
  
  // Campos de estatísticas específicos
  ins?: string;
  mid?: string;
  "3pt"?: string;
  ins_d?: string;
  per_d?: string;
  plmk?: string;
  reb?: string;
  phys?: string;
  iq?: string;
  pot?: string;
  
  team_id?: number | null;
  source?: 'ocr' | 'manual';
}

export interface UpdatePlayerData extends Partial<CreatePlayerData> {}

export interface PlayerQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  position?: string;
  team_id?: number;
  min_overall?: number;
  max_overall?: number;
  is_free_agent?: boolean;
}

export interface TransferPlayerData {
  new_team_id: number;
}

export interface BatchUpdateData {
  player_ids: number[];
  updates: Partial<UpdatePlayerData>;
}

export interface OCRRequestData {
  image_url: string;
  team_id?: number;
}

// Serviço de Players
export const playerService = {
  // Buscar todos os players com filtros
  getAllPlayers: (params?: PlayerQueryParams) =>
    apiRequest.get<Player[]>('/players', params),

  // Buscar player por ID
  getPlayerById: (id: number) =>
    apiRequest.get<Player>(`/players/${id}`),

  // Buscar free agents
  // getFreeAgents: () =>
  //   apiRequest.get<Player[]>('/players/free-agents'),

  // Buscar players por time
  getPlayersByTeam: (teamId: number) =>
    apiRequest.get<Player[]>(`/players/team/${teamId}`),

  // Buscar todos os players de um time (sem paginação)
  getAllPlayersByTeam: (teamId: number) =>
    apiRequest.get<Player[]>(`/players/team/${teamId}?limit=1000`),

  // Buscar players por posição
  // getPlayersByPosition: (position: string) =>
  //   apiRequest.get<Player[]>(`/players/position/${position}`),

  // Criar novo player
  createPlayer: (data: CreatePlayerData) =>
    apiRequest.post<Player>('/players', data),

  // Criar player via OCR
  createPlayerOCR: (data: OCRRequestData) =>
    apiRequest.post<Player>('/players/ocr', data),

  // Atualizar player
  updatePlayer: (id: number, data: UpdatePlayerData) =>
    apiRequest.put<Player>(`/players/${id}`, data),

  // Atualização em lote
  // batchUpdatePlayers: (data: BatchUpdateData) =>
  //   apiRequest.put<Player[]>('/players/batch', data),

  // Transferir player
  // transferPlayer: (id: number, data: TransferPlayerData) =>
  //   apiRequest.patch<Player>(`/players/${id}/transfer`, data),

  // Liberar player (tornar free agent)
  releasePlayer: (id: number) =>
    apiRequest.patch<Player>(`/players/${id}/release`),

  // Deletar player
  deletePlayer: (id: number) =>
    apiRequest.delete<void>(`/players/${id}`),
}; 