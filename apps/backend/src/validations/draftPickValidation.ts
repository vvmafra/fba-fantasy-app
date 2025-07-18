import { z } from 'zod';

// Schema para criar draft pick
export const createDraftPickSchema = z.object({
  season_id: z.number().int('Season ID deve ser um número inteiro'),
  team_id: z.number().int('Team ID deve ser um número inteiro'),
  pick_number: z.number().int().min(1, 'Pick deve ser maior que 0').max(60, 'Pick deve ser menor ou igual a 60'),
  player_name: z.string().optional().nullable(),
  player_position: z.string().optional().nullable(),
  player_age: z.number().int().min(17, 'Idade mínima é 17').max(50, 'Idade máxima é 50').optional().nullable(),
  player_ovr: z.number().int().min(0, 'Overall mínimo é 0').max(99, 'Overall máximo é 99').optional().nullable(),
});

// Schema para atualizar draft pick
export const updateDraftPickSchema = z.object({
  season_id: z.number().int('Season ID deve ser um número inteiro').optional(),
  team_id: z.number().int('Team ID deve ser um número inteiro').optional(),
  pick_number: z.number().int().min(1, 'Pick deve ser maior que 0').max(60, 'Pick deve ser menor ou igual a 60').optional(),
  player_name: z.string().optional().nullable(),
  player_position: z.string().optional().nullable(),
  player_age: z.number().int().min(17, 'Idade mínima é 17').max(50, 'Idade máxima é 50').optional().nullable(),
  player_ovr: z.number().int().min(0, 'Overall mínimo é 0').max(99, 'Overall máximo é 99').optional().nullable(),
  is_added_to_2k: z.boolean().optional(),
  player_id: z.number().int().optional().nullable(),
});

// Schema para ID do draft pick
export const draftPickIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID deve ser um número válido'),
});

// Schema para adicionar jogador ao draft pick
export const addPlayerToDraftPickSchema = z.object({
  player_id: z.number().int('Player ID deve ser um número inteiro'),
});

// Schema para criar jogador e adicionar ao draft pick
export const createPlayerForDraftPickSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  position: z.string().min(1, 'Posição é obrigatória').max(100, 'Posição deve ter no máximo 100 caracteres'),
  age: z.number().int().min(17, 'Idade mínima é 17').max(50, 'Idade máxima é 50'),
  ovr: z.number().int().min(0, 'Overall mínimo é 0').max(99, 'Overall máximo é 99'),
});

// Schema para query parameters
export const draftPickQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, 'Página deve ser um número válido').optional(),
  limit: z.string().regex(/^\d+$/, 'Limite deve ser um número válido').optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  season_id: z.string().regex(/^\d+$/, 'Season ID deve ser um número válido').optional(),
  team_id: z.string().regex(/^\d+$/, 'Team ID deve ser um número válido').optional(),
  is_added_to_2k: z.enum(['true', 'false']).optional(),
});

// Schema para season ID
export const seasonIdSchema = z.object({
  seasonId: z.string().regex(/^\d+$/, 'Season ID deve ser um número válido'),
});

// Tipos derivados dos schemas
export type CreateDraftPickData = z.infer<typeof createDraftPickSchema>;
export type UpdateDraftPickData = z.infer<typeof updateDraftPickSchema>;
export type AddPlayerToDraftPickData = z.infer<typeof addPlayerToDraftPickSchema>; 