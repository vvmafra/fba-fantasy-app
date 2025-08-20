import { apiRequest } from '@/lib/api';

export interface Pick {
  id: number;
  original_team_id: number;
  current_team_id: number;
  round: number;
  season_id: number;
  season_year: number;
  original_team_name: string;
  current_team_name: string;
}

export interface TeamFuturePicks {
  my_own_picks: Pick[];
  received_picks: Pick[];
  lost_picks: Pick[];
}

export const getTeamFuturePicks = (teamId: number) => {
  return apiRequest.get<TeamFuturePicks>(`/picks/team/${teamId}/future`);
};

export const getAllPicks = () => {
  return apiRequest.get<Pick[]>('/picks');
}; 