import { Player } from '@/services/playerService';

export interface PlayerWithMinutes extends Player {
  minutes: number;
  isGLeague: boolean;
  isStarter: boolean;
}

export interface ValidationErrors {
  totalMinutes?: string;
  top5Minutes?: string;
  maxMinutes?: string;
  benchMinutes?: string;
  minPlayers?: string;
  gleagueEligibility?: string;
  gleagueCount?: string;
  gameStyle?: string;
  offenseStyle?: string;
  defenseStyle?: string;
}

export interface RosterFormData {
  season_id: number;
  team_id: number;
  rotation_style: 'automatic' | 'manual';
  minutes_starting: [number, number][];
  minutes_bench: [number, number][];
  gleague1_player_id?: number | null;
  gleague2_player_id?: number | null;
  total_players_rotation?: number;
  age_preference?: number;
  game_style?: string;
  franchise_player_id?: number | null;
  offense_style?: string;
  defense_style?: string;
} 