import { apiRequest } from '@/lib/api';

export interface PickSwap {
  id: number;
  season_id: number;
  swap_type: 'best' | 'worst';
  pick_a_id: number;
  pick_b_id: number;
  owned_by_team_id: number;
  created_at: string;
}

export interface PickSwapWithDetails extends PickSwap {
  pick_a: {
    id: number;
    round: number;
    year: number;
    original_team_id: number;
    original_team_name: string;
    original_team_abbreviation: string;
  };
  pick_b: {
    id: number;
    round: number;
    year: number;
    original_team_id: number;
    original_team_name: string;
    original_team_abbreviation: string;
  };
  owned_by_team: {
    id: number;
    name: string;
    abbreviation: string;
  };
}

export interface CreatePickSwapRequest {
  season_id: number;
  swap_type: 'best' | 'worst';
  pick_a_id: number;
  pick_b_id: number;
  owned_by_team_id: number;
}

// Buscar todos os pick swaps
export const getAllPickSwaps = () => {
  return apiRequest.get<PickSwapWithDetails[]>('/pick-swaps');
};

// Buscar pick swap por ID
export const getPickSwapById = (id: number) => {
  return apiRequest.get<PickSwapWithDetails>(`/pick-swaps/${id}`);
};

// Criar novo pick swap
export const createPickSwap = (data: CreatePickSwapRequest) => {
  return apiRequest.post<PickSwap>('/pick-swaps', data);
};

// Deletar pick swap
export const deletePickSwap = (id: number) => {
  return apiRequest.delete(`/pick-swaps/${id}`);
};

// Buscar swaps de um time
export const getTeamPickSwaps = (teamId: number) => {
  return apiRequest.get<PickSwapWithDetails[]>(`/pick-swaps/team/${teamId}`);
}; 