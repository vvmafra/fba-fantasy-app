import { z } from 'zod';

// Schema para adicionar jogador dispensado aos waivers
export const addReleasedPlayerSchema = z.object({
  playerId: z.number().int().positive('ID do jogador deve ser um número inteiro positivo'),
  teamId: z.number().int().positive('ID do time deve ser um número inteiro positivo'),
  seasonId: z.number().int().positive('ID da temporada deve ser um número inteiro positivo'),
});

// Schema para atualizar waiver
export const updateWaiverSchema = z.object({
  team_id: z.number().int().positive('ID do time deve ser um número inteiro positivo').optional(),
  player_id: z.number().int().positive('ID do jogador deve ser um número inteiro positivo').optional(),
  season_id: z.number().int().positive('ID da temporada deve ser um número inteiro positivo').optional(),
});

// Schema para parâmetros de rota
export const waiverParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID deve ser um número'),
  seasonId: z.string().regex(/^\d+$/, 'ID da temporada deve ser um número').optional(),
  teamId: z.string().regex(/^\d+$/, 'ID do time deve ser um número').optional(),
});

// Tipos derivados dos schemas
export type AddReleasedPlayerInput = z.infer<typeof addReleasedPlayerSchema>;
export type UpdateWaiverInput = z.infer<typeof updateWaiverSchema>;
export type WaiverParams = z.infer<typeof waiverParamsSchema>;
