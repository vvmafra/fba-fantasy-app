import { z } from 'zod';

// Schema para criação de trade
export const createTradeSchema = z.object({
  season_id: z.number().int('Season ID deve ser um número inteiro'),
  created_by_team: z.number().int('Time criador deve ser um ID válido'),
  participants: z.array(z.object({
    team_id: z.number().int('Team ID deve ser um número inteiro'),
    is_initiator: z.boolean(),
    assets: z.array(z.object({
      asset_type: z.enum(['player', 'pick'], {
        errorMap: () => ({ message: 'Asset type deve ser player ou pick' })
      }),
      player_id: z.number().int().optional(),
      pick_id: z.number().int().optional(),
      to_participant_id: z.number().int().optional(),
    })).min(1, 'Pelo menos um asset deve ser fornecido'),
  })).min(2, 'Pelo menos dois times devem participar da trade'),
});

// Schema para atualização de participante da trade
export const updateTradeParticipantSchema = z.object({
  response_status: z.enum(['accepted', 'rejected'], {
    errorMap: () => ({ message: 'Response status deve ser accepted ou rejected' })
  }),
});

// Schema para parâmetros de ID da trade
export const tradeIdSchema = z.object({
  id: z.coerce.number().int('ID deve ser um número inteiro'),
});

// Schema para parâmetros de ID do participante
export const participantIdSchema = z.object({
  id: z.coerce.number().int('ID deve ser um número inteiro'),
});

// Schema para query parameters com filtros
export const tradeQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['created_at', 'status', 'executed_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  season_id: z.coerce.number().int().optional(),
  status: z.enum(['proposed', 'pending', 'executed', 'reverted', 'cancelled']).optional(),
  team_id: z.coerce.number().int().optional(),
  created_by_team: z.coerce.number().int().optional(),
});

// Schema para execução de trade
export const executeTradeSchema = z.object({
  trade_id: z.number().int('Trade ID deve ser um número inteiro'),
});

// Schema para reversão de trade
export const revertTradeSchema = z.object({
  reverted_by_user: z.number().int('User ID deve ser um número inteiro'),
});

// Tipos inferidos dos schemas
export type CreateTradeInput = z.infer<typeof createTradeSchema>;
export type UpdateTradeParticipantInput = z.infer<typeof updateTradeParticipantSchema>;
export type TradeIdInput = z.infer<typeof tradeIdSchema>;
export type ParticipantIdInput = z.infer<typeof participantIdSchema>;
export type TradeQueryInput = z.infer<typeof tradeQuerySchema>;
export type ExecuteTradeInput = z.infer<typeof executeTradeSchema>;
export type RevertTradeInput = z.infer<typeof revertTradeSchema>; 