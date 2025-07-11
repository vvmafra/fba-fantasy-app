import { z } from 'zod';

// Schema para criação de roster playoffs
export const createRosterPlayoffsSchema = z.object({
  season_id: z.number().positive('ID da temporada deve ser positivo'),
  team_id: z.number().positive('ID do time deve ser positivo'),
  rotation_style: z.enum(['automatic', 'manual'], {
    errorMap: () => ({ message: 'Estilo de rotação deve ser "automatic" ou "manual"' })
  }),
  minutes_starting: z.any().optional(),
  minutes_bench: z.any().optional(),
  total_players_rotation: z.number().min(8, 'Total de jogadores na rotação deve ser pelo menos 8').max(15, 'Total de jogadores na rotação não pode exceder 15').optional(),
  age_preference: z.number().min(0, 'Preferência de idade deve ser entre 0 e 100').max(100, 'Preferência de idade deve ser entre 0 e 100').nullable().optional(),
  game_style: z.string().max(50, 'Estilo de jogo deve ter no máximo 50 caracteres'),
  franchise_player_id: z.number().positive('ID do jogador franquia deve ser positivo').nullable().optional(),
  offense_style: z.string().max(50, 'Estilo de ataque deve ter no máximo 50 caracteres'),
  defense_style: z.string().max(50, 'Estilo de defesa deve ter no máximo 50 caracteres'),
});

// Schema para atualização de roster playoffs
export const updateRosterPlayoffsSchema = z.object({
  season_id: z.number().positive('ID da temporada deve ser positivo').optional(),
  team_id: z.number().positive('ID do time deve ser positivo').optional(),
  rotation_style: z.enum(['automatic', 'manual'], {
    errorMap: () => ({ message: 'Estilo de rotação deve ser "automatic" ou "manual"' })
  }).optional(),
  minutes_starting: z.any().optional(),
  minutes_bench: z.any().optional(),
  total_players_rotation: z.number().min(8, 'Total de jogadores na rotação deve ser pelo menos 8').max(15, 'Total de jogadores na rotação não pode exceder 15').optional(),
  age_preference: z.number().min(0, 'Preferência de idade deve ser entre 0 e 100').max(100, 'Preferência de idade deve ser entre 0 e 100').nullable().optional(),
  game_style: z.string().max(50, 'Estilo de jogo deve ter no máximo 50 caracteres'),
  franchise_player_id: z.number().positive('ID do jogador franquia deve ser positivo').nullable().optional(),
  offense_style: z.string().max(50, 'Estilo de ataque deve ter no máximo 50 caracteres'),
  defense_style: z.string().max(50, 'Estilo de defesa deve ter no máximo 50 caracteres'),
});

// Schema para ID do roster playoffs
export const rosterPlayoffsIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID deve ser um número válido')
});

// Schema para query parameters
export const rosterPlayoffsQuerySchema = z.object({
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