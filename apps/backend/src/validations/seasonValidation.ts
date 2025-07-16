import { z } from 'zod';

// Schema para criar temporada
export const createSeasonSchema = z.object({
  season_number: z.number().min(1, 'Número da temporada deve ser maior que 0'),
  total_seasons: z.number().min(1, 'Total de temporadas deve ser maior que 0'),
  is_active: z.boolean().optional().default(false),
  year: z.string().min(4, 'Ano deve ter pelo menos 4 caracteres'),
});

// Schema para atualizar temporada
export const updateSeasonSchema = z.object({
  season_number: z.number().min(1, 'Número da temporada deve ser maior que 0').optional(),
  total_seasons: z.number().min(1, 'Total de temporadas deve ser maior que 0').optional(),
  is_active: z.boolean().optional(),
  year: z.string().min(4, 'Ano deve ter pelo menos 4 caracteres').optional(),
});

// Schema para ID de temporada
export const seasonIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID deve ser um número válido'),
});

export type CreateSeasonData = z.infer<typeof createSeasonSchema>;
export type UpdateSeasonData = z.infer<typeof updateSeasonSchema>; 