import { z } from 'zod';

// Schema para criar premiação
export const createSeasonAwardsSchema = z.object({
  season_id: z.number().min(1, 'ID da temporada deve ser maior que 0'),
  mvp_player_id: z.number().min(1, 'ID do jogador MVP deve ser maior que 0').nullable().optional(),
  mvp_team_id: z.number().min(1, 'ID do time MVP deve ser maior que 0').nullable().optional(),
  roy_player_id: z.number().min(1, 'ID do jogador ROY deve ser maior que 0').nullable().optional(),
  roy_team_id: z.number().min(1, 'ID do time ROY deve ser maior que 0').nullable().optional(),
  smoy_player_id: z.number().min(1, 'ID do jogador SMOY deve ser maior que 0').nullable().optional(),
  smoy_team_id: z.number().min(1, 'ID do time SMOY deve ser maior que 0').nullable().optional(),
  dpoy_player_id: z.number().min(1, 'ID do jogador DPOY deve ser maior que 0').nullable().optional(),
  dpoy_team_id: z.number().min(1, 'ID do time DPOY deve ser maior que 0').nullable().optional(),
  mip_player_id: z.number().min(1, 'ID do jogador MIP deve ser maior que 0').nullable().optional(),
  mip_team_id: z.number().min(1, 'ID do time MIP deve ser maior que 0').nullable().optional(),
  coy_user_id: z.number().min(1, 'ID do usuário COY deve ser maior que 0').nullable().optional(),
  coy_team_id: z.number().min(1, 'ID do time COY deve ser maior que 0').nullable().optional(),
});

// Schema para atualizar premiação
export const updateSeasonAwardsSchema = z.object({
  season_id: z.number().min(1, 'ID da temporada deve ser maior que 0').optional(),
  mvp_player_id: z.number().min(1, 'ID do jogador MVP deve ser maior que 0').nullable().optional(),
  mvp_team_id: z.number().min(1, 'ID do time MVP deve ser maior que 0').nullable().optional(),
  roy_player_id: z.number().min(1, 'ID do jogador ROY deve ser maior que 0').nullable().optional(),
  roy_team_id: z.number().min(1, 'ID do time ROY deve ser maior que 0').nullable().optional(),
  smoy_player_id: z.number().min(1, 'ID do jogador SMOY deve ser maior que 0').nullable().optional(),
  smoy_team_id: z.number().min(1, 'ID do time SMOY deve ser maior que 0').nullable().optional(),
  dpoy_player_id: z.number().min(1, 'ID do jogador DPOY deve ser maior que 0').nullable().optional(),
  dpoy_team_id: z.number().min(1, 'ID do time DPOY deve ser maior que 0').nullable().optional(),
  mip_player_id: z.number().min(1, 'ID do jogador MIP deve ser maior que 0').nullable().optional(),
  mip_team_id: z.number().min(1, 'ID do time MIP deve ser maior que 0').nullable().optional(),
  coy_user_id: z.number().min(1, 'ID do usuário COY deve ser maior que 0').nullable().optional(),
  coy_team_id: z.number().min(1, 'ID do time COY deve ser maior que 0').nullable().optional(),
});

// Schema para ID de premiação
export const seasonAwardsIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID deve ser um número válido'),
});

// Schema para ID de temporada
export const seasonIdSchema = z.object({
  seasonId: z.string().regex(/^\d+$/, 'ID da temporada deve ser um número válido'),
});

export type CreateSeasonAwardsData = z.infer<typeof createSeasonAwardsSchema>;
export type UpdateSeasonAwardsData = z.infer<typeof updateSeasonAwardsSchema>; 