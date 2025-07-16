import { z } from 'zod';

// Schema para criar league cap
export const createLeagueCapSchema = z.object({
  season_id: z.number().int('Season ID deve ser um número inteiro'),
  min_cap: z.number().int().min(0, 'CAP mínimo deve ser maior ou igual a 0'),
  max_cap: z.number().int().min(0, 'CAP máximo deve ser maior ou igual a 0'),
});

// Schema para atualizar league cap
export const updateLeagueCapSchema = z.object({
  season_id: z.number().int('Season ID deve ser um número inteiro').optional(),
  min_cap: z.number().int().min(0, 'CAP mínimo deve ser maior ou igual a 0').optional(),
  max_cap: z.number().int().min(0, 'CAP máximo deve ser maior ou igual a 0').optional(),
  is_active: z.boolean().optional(),
});

// Schema para ID de league cap
export const leagueCapIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID deve ser um número válido'),
});

export type CreateLeagueCapData = z.infer<typeof createLeagueCapSchema>;
export type UpdateLeagueCapData = z.infer<typeof updateLeagueCapSchema>; 