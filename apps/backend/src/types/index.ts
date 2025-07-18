// Tipos base para a aplicação
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Tipos para Players - baseados na nova estrutura do banco
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
  season_id?: number | 1;
}

export interface CreatePlayerRequest {
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
  season_id?: number | 1;
}

export interface UpdatePlayerRequest extends Partial<CreatePlayerRequest> {
  id: number;
}

// Novos tipos para filtros e operações
export interface PlayerFilters {
  name?: string;
  team?: number; // ID do time
  position?: string;
  isFreeAgent?: boolean;
  season_id?: number;
}

export interface PlayerQueryParams extends PaginationParams, PlayerFilters {}

export interface BatchUpdateRequest {
  players: Array<{
    id: number;
    updates: Partial<CreatePlayerRequest>;
  }>;
}

export interface TransferPlayerRequest {
  newTeam: number;
}

export interface OCRRequest {
  imageUrl: string;
  imageData?: string; // base64
}

export interface OCRResponse {
  players: CreatePlayerRequest[];
  confidence: number;
}

// Tipos para erros
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

// Tipos para middleware de autenticação
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Tipos para Teams
export interface Team {
  id: number;
  name: string;
  abbreviation: string;
  owner_id: number | null;
  owner_name?: string | null;
  logo_path?: string | null;
  logo_updated_at?: string | null;
  player_order?: {
    starters: number[];
    bench: number[];
    last_updated?: string;
  } | null;
}

export interface CreateTeamRequest {
  name: string;
  abbreviation: string;
  owner_id?: number | null;
}

export interface UpdateTeamRequest extends Partial<CreateTeamRequest> {
  id: number;
  player_order?: {
    starters: number[];
    bench: number[];
    last_updated?: string;
  };
}

// Tipos para Roster
export interface RosterSeason {
  id: number;
  season_id: number;
  team_id: number;
  rotation_style: 'automatic' | 'manual';
  minutes_starting?: [number, number][]; // Array de pares [playerId, minutos]
  minutes_bench?: [number, number][]; // Array de pares [playerId, minutos]
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
}

export interface CreateRosterSeasonRequest {
  season_id: number;
  team_id: number;
  rotation_style: 'automatic' | 'manual';
  minutes_starting?: [number, number][];
  minutes_bench?: [number, number][];
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
}

export interface UpdateRosterSeasonRequest extends Partial<CreateRosterSeasonRequest> {
  id: number;
}

export interface RosterFilters {
  season_id?: number;
  team_id?: number;
  rotation_style?: 'automatic' | 'manual';
  game_style?: string;
  offense_style?: string;
  defense_style?: string;
}

export interface RosterQueryParams extends PaginationParams, RosterFilters {}

// Tipos para Roster Playoffs
export interface RosterPlayoffs {
  id: number;
  season_id: number;
  team_id: number;
  rotation_style: 'automatic' | 'manual';
  minutes_starting?: [number, number][]; // Array de pares [playerId, minutos]
  minutes_bench?: [number, number][]; // Array de pares [playerId, minutos]
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
}

export interface CreateRosterPlayoffsRequest {
  season_id: number;
  team_id: number;
  rotation_style: 'automatic' | 'manual';
  minutes_starting?: [number, number][];
  minutes_bench?: [number, number][];
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
}

export interface UpdateRosterPlayoffsRequest extends Partial<CreateRosterPlayoffsRequest> {
  id: number;
}

export interface RosterPlayoffsFilters {
  season_id?: number;
  team_id?: number;
  rotation_style?: 'automatic' | 'manual';
  game_style?: string;
  offense_style?: string;
  defense_style?: string;
}

export interface RosterPlayoffsQueryParams extends PaginationParams, RosterPlayoffsFilters {}

// Tipos para Deadlines
export interface Deadline {
  id: number;
  season_id: number;
  title: string;
  description?: string;
  deadline_date: string; // Data no formato YYYY-MM-DD
  deadline_time: string; // Horário no formato HH:MM:SS
  type: 'draft' | 'trade_deadline' | 'fa_deadline' | 'regular_roster' | 'playoffs_roster' | 'regular_season' | 'playoffs' | 'other';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateDeadlineRequest {
  season_id: number;
  title: string;
  description?: string;
  deadline_date: string; // Data no formato YYYY-MM-DD
  deadline_time: string; // Horário no formato HH:MM:SS
  type: 'draft' | 'trade_deadline' | 'fa_deadline' | 'regular_roster' | 'playoffs_roster' | 'regular_season' | 'playoffs' | 'other';
  is_active?: boolean;
}

export interface UpdateDeadlineRequest extends Partial<CreateDeadlineRequest> {}

// Tipos para Trades
export interface Trade {
  id: number;
  season_id: number;
  status: 'proposed' | 'pending' | 'executed' | 'reverted' | 'cancelled';
  created_by_team: number;
  created_at: string;
  executed_at?: string | null;
  reverted_at?: string | null;
  reverted_by_user?: number | null;
  made?: boolean;
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
  to_participant_id?: number | null;
  to_team_id?: number | null;
  to_team_name?: string;
  to_team_abbreviation?: string;
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
      to_participant_id?: number;
    }>;
  }>;
}

export interface UpdateTradeParticipantRequest {
  response_status: 'accepted' | 'rejected';
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
  made?: boolean;
}

export interface TradeFilters {
  season_id?: number;
  status?: 'proposed' | 'pending' | 'executed' | 'reverted' | 'cancelled';
  team_id?: number;
  created_by_team?: number;
  made?: boolean;
}

export interface TradeQueryParams extends PaginationParams, TradeFilters {}

export interface ExecuteTradeRequest {
  trade_id: number;
}

export interface RevertTradeRequest {
  reverted_by_user: number;
}

// Tipos para Users
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface CreateUserRequest {
  name: string;
  email: string;
  role?: 'admin' | 'user';
}

export interface UpdateUserRequest extends Partial<CreateUserRequest> {
  id: number;
}

export interface UserFilters {
  name?: string;
  email?: string;
  role?: 'admin' | 'user';
}

export interface UserQueryParams extends PaginationParams, UserFilters {} 

// Tipos para LeagueCap
export interface LeagueCap {
  id: number;
  season_id: number;
  min_cap: number;
  max_cap: number;
  avg_cap: number;
  is_active: boolean;
  created_at: string;
}

export interface CreateLeagueCapRequest {
  season_id: number;
  min_cap: number;
  max_cap: number;
}

export interface UpdateLeagueCapRequest extends Partial<CreateLeagueCapRequest> {
  is_active?: boolean;
}

// Tipos para Draft Picks
export interface DraftPick {
  id: number;
  season_id: number;
  player_id?: number | null;
  team_id: number;
  pick_number: number;
  is_added_to_2k: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateDraftPickRequest {
  season_id: number;
  team_id: number;
  pick_number: number;
}

export interface UpdateDraftPickRequest extends Partial<CreateDraftPickRequest> {
  id: number;
  is_added_to_2k?: boolean;
  player_id?: number | null;
}

export interface DraftPickFilters {
  season_id?: number;
  team_id?: number;
  is_added_to_2k?: boolean;
}

export interface DraftPickQueryParams extends PaginationParams, DraftPickFilters {}

export interface AddPlayerToDraftPickRequest {
  player_id: number;
}

export interface CreatePlayerForDraftPickRequest {
  name: string;
  position: string;
  age: number;
  ovr: number;
} 

// Tipos para Season Awards
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
  // updated_at: string;
}

export interface CreateSeasonAwardsRequest {
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

export interface UpdateSeasonAwardsRequest extends Partial<CreateSeasonAwardsRequest> {
  id: number;
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