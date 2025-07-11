import { apiRequest } from '@/lib/api';

// Tipos baseados no backend real
export interface Trade {
  id: number;
  season_id: number;
  status: 'proposed' | 'pending' | 'executed' | 'reverted' | 'cancelled';
  created_by_team: number;
  created_at: string;
  executed_at?: string | null;
  reverted_at?: string | null;
  reverted_by_user?: number | null;
}

export interface TradeParticipant {
  id: number;
  trade_id: number;
  team_id: number;
  is_initiator: boolean;
  response_status: 'pending' | 'accepted' | 'rejected';
  responded_at?: string | null;
}

export interface TradeAsset {
  id: number;
  participant_id: number;
  asset_type: 'player' | 'pick';
  player_id?: number | null;
  pick_id?: number | null;
  to_team_id?: number | null;
}

export interface TradeAssetMovement {
  id: number;
  trade_id: number;
  asset_type: 'player' | 'pick';
  asset_id: number;
  from_team_id: number;
  to_team_id: number;
  moved_at: string;
}

export interface TradeWithDetails extends Trade {
  participants: Array<TradeParticipant & {
    team: {
      id: number;
      name: string;
      abbreviation: string;
    };
    assets: Array<TradeAsset & {
      player?: {
        id: number;
        name: string;
        position: string;
        ovr: number;
      } | null;
      pick?: {
        id: number;
        round: number;
        year: number;
        original_team_id: number;
      } | null;
    }>;
  }>;
  movements?: TradeAssetMovement[];
}

export interface CreateTradeRequest {
  season_id: number;
  created_by_team: number;
  participants: Array<{
    team_id: number;
    is_initiator: boolean;
    assets: Array<{
      asset_type: 'player' | 'pick';
      player_id?: number;
      pick_id?: number;
      to_team_id?: number;
    }>;
  }>;
}

export interface UpdateTradeParticipantRequest {
  response_status: 'accepted' | 'rejected';
}

export interface TradeFilters {
  season_id?: number;
  status?: 'proposed' | 'pending' | 'executed' | 'reverted' | 'cancelled';
  team_id?: number;
  created_by_team?: number;
}

export interface TradeQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  season_id?: number;
  status?: 'proposed' | 'pending' | 'executed' | 'reverted' | 'cancelled';
  team_id?: number;
  created_by_team?: number;
}

export interface TradeCounts {
  proposed: number;
  pending: number;
  executed: number;
  reverted: number;
  cancelled: number;
}

// Serviço de Trades
export const tradeService = {
  // Buscar todas as trades com filtros
  getAllTrades: (params?: TradeQueryParams) =>
    apiRequest.get<Trade[]>('/trades', params),

  // Buscar trade por ID com detalhes
  getTradeById: (id: number) =>
    apiRequest.get<TradeWithDetails>(`/trades/${id}`),

  // Buscar trades de um time específico
  getTradesByTeam: (teamId: number, seasonId?: number) =>
    apiRequest.get<Trade[]>(`/trades/team/${teamId}`, { season_id: seasonId }),

  // Contar trades por status
  getTradeCounts: (seasonId?: number) =>
    apiRequest.get<TradeCounts>('/trades/counts', { season_id: seasonId }),

  // Criar nova trade
  createTrade: (data: CreateTradeRequest) =>
    apiRequest.post<Trade>('/trades', data),

  // Atualizar resposta de participante
  updateParticipantResponse: (participantId: number, data: UpdateTradeParticipantRequest) =>
    apiRequest.patch<TradeParticipant>(`/trades/participants/${participantId}`, data),

  // Executar trade (admin apenas)
  executeTrade: (tradeId: number) =>
    apiRequest.post<Trade>(`/trades/${tradeId}/execute`),

  // Reverter trade (admin apenas)
  revertTrade: (tradeId: number, revertedByUser: number) =>
    apiRequest.post<Trade>(`/trades/${tradeId}/revert`, { reverted_by_user: revertedByUser }),

  // Contar trades do usuário autenticado
  countMyTrades: (teamId: number) =>
    apiRequest.get<number>(`/trades/my-trades/count`, { team_id: teamId }),
}; 