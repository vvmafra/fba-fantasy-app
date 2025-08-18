import { z } from 'zod';

// Schema para criação de roster
export const createRosterSeasonSchema = z.object({
  season_id: z.number().positive('ID da temporada deve ser positivo'),
  team_id: z.number().positive('ID do time deve ser positivo'),
  rotation_style: z.enum(['automatic', 'manual'], {
    errorMap: () => ({ message: 'Estilo de rotação deve ser "automatic" ou "manual"' })
  }).default('automatic'),
  minutes_starting: z.any().optional(),
  minutes_bench: z.any().optional(),
  gleague1_player_id: z.number().positive('ID do jogador G-League 1 deve ser positivo').nullable().optional(),
  gleague2_player_id: z.number().positive('ID do jogador G-League 2 deve ser positivo').nullable().optional(),
  total_players_rotation: z.number().min(8, 'Total de jogadores na rotação deve ser pelo menos 8').max(15, 'Total de jogadores na rotação não pode exceder 15').optional(),
  age_preference: z.number().min(0, 'Preferência de idade deve ser entre 0 e 100').max(100, 'Preferência de idade deve ser entre 0 e 100').nullable().optional(),
  game_style: z.string().min(1, 'Estilo de jogo é obrigatório').max(50, 'Estilo de jogo deve ter no máximo 50 caracteres'),
  franchise_player_id: z.number().positive('ID do jogador franquia deve ser positivo').nullable().optional(),
  offense_style: z.string().min(1, 'Estilo de ataque é obrigatório').max(50, 'Estilo de ataque deve ter no máximo 50 caracteres'),
  defense_style: z.string().min(1, 'Estilo de defesa é obrigatório').max(50, 'Estilo de defesa deve ter no máximo 50 caracteres'),
  offensive_tempo: z.enum(['No preference', 'Patient Offense', 'Average Tempo', 'Shoot at Will'], {
    errorMap: () => ({ message: 'Tempo ofensivo deve ser uma das opções válidas' })
  }).optional(),
  offensive_rebounding: z.enum(['Limit Transition', 'No preference', 'Crash Offensive Glass', 'Some Crash, Others Get Back'], {
    errorMap: () => ({ message: 'Rebote ofensivo deve ser uma das opções válidas' })
  }).optional(),
  defensive_aggression: z.enum(['Play Physical Defense', 'No preference', 'Conservative Defense', 'Neutral Defensive Aggression'], {
    errorMap: () => ({ message: 'Agressão defensiva deve ser uma das opções válidas' })
  }).optional(),
  defensive_rebounding: z.enum(['Run in Transition', 'Crash Defensive Glass', 'Some Crash, Others Run', 'No preference'], {
    errorMap: () => ({ message: 'Rebote defensivo deve ser uma das opções válidas' })
  }).optional(),
  rotation_made: z.boolean().optional(),
  updated_at: z.string().optional(),
});

// Schema para atualização de roster
export const updateRosterSeasonSchema = z.object({
  season_id: z.number().positive('ID da temporada deve ser positivo').optional(),
  team_id: z.number().positive('ID do time deve ser positivo').optional(),
  rotation_style: z.enum(['automatic', 'manual'], {
    errorMap: () => ({ message: 'Estilo de rotação deve ser "automatic" ou "manual"' })
  }).optional(),
  minutes_starting: z.any().optional(),
  minutes_bench: z.any().optional(),
  gleague1_player_id: z.number().positive('ID do jogador G-League 1 deve ser positivo').nullable().optional(),
  gleague2_player_id: z.number().positive('ID do jogador G-League 2 deve ser positivo').nullable().optional(),
  total_players_rotation: z.number().min(8, 'Total de jogadores na rotação deve ser pelo menos 8').max(15, 'Total de jogadores na rotação não pode exceder 15').optional(),
  age_preference: z.number().min(0, 'Preferência de idade deve ser entre 0 e 100').max(100, 'Preferência de idade deve ser entre 0 e 100').nullable().optional(),
  game_style: z.string().min(1, 'Estilo de jogo é obrigatório').max(50, 'Estilo de jogo deve ter no máximo 50 caracteres').optional(),
  franchise_player_id: z.number().positive('ID do jogador franquia deve ser positivo').nullable().optional(),
  offense_style: z.string().min(1, 'Estilo de ataque é obrigatório').max(50, 'Estilo de ataque deve ter no máximo 50 caracteres').optional(),
  defense_style: z.string().min(1, 'Estilo de defesa é obrigatório').max(50, 'Estilo de defesa deve ter no máximo 50 caracteres').optional(),
  offensive_tempo: z.enum(['No preference', 'Patient Offense', 'Average Tempo', 'Shoot at Will'], {
    errorMap: () => ({ message: 'Tempo ofensivo deve ser uma das opções válidas' })
  }).optional(),
  offensive_rebounding: z.enum(['Limit Transition', 'No preference', 'Crash Offensive Glass', 'Some Crash, Others Get Back'], {
    errorMap: () => ({ message: 'Rebote ofensivo deve ser uma das opções válidas' })
  }).optional(),
  defensive_aggression: z.enum(['Play Physical Defense', 'No preference', 'Conservative Defense', 'Neutral Defensive Aggression'], {
    errorMap: () => ({ message: 'Agressão defensiva deve ser uma das opções válidas' })
  }).optional(),
  defensive_rebounding: z.enum(['Run in Transition', 'Crash Defensive Glass', 'Some Crash, Others Run', 'No preference'], {
    errorMap: () => ({ message: 'Rebote defensivo deve ser uma das opções válidas' })
  }).optional(),
  rotation_made: z.boolean().optional(),
  updated_at: z.string().optional(),
});

// Schema para ID do roster
export const rosterIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID deve ser um número válido')
});

// Schema para query parameters
export const rosterQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, 'Página deve ser um número válido').optional(),
  limit: z.string().regex(/^\d+$/, 'Limite deve ser um número válido').optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  season_id: z.string().regex(/^\d+$/, 'ID da temporada deve ser um número válido').optional(),
  team_id: z.string().regex(/^\d+$/, 'ID do time deve ser um número válido').optional(),
  rotation_style: z.enum(['automatic', 'manual']).optional(),
  game_style: z.string().optional(),
  offense_style: z.string().optional(),
  defense_style: z.string().optional(),
}); 