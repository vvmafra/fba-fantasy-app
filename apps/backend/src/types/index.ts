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