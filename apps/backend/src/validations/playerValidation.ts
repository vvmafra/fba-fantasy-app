import { z } from 'zod';

// Schema para criação de player
export const createPlayerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  position: z.enum(['PG', 'SG', 'SF', 'PF', 'C'], {
    errorMap: () => ({ message: 'Posição deve ser PG, SG, SF, PF ou C' })
  }),
  age: z.number().int().min(18, 'Idade mínima é 18').max(50, 'Idade máxima é 50'),
  ovr: z.number().int().min(0).max(99),
  
  // Campos de estatísticas específicos
  ins: z.string().optional(),
  mid: z.string().optional(),
  "3pt": z.string().optional(),
  ins_d: z.string().optional(),
  per_d: z.string().optional(),
  plmk: z.string().optional(),
  reb: z.string().optional(),
  phys: z.string().optional(),
  iq: z.string().optional(),
  pot: z.string().optional(),
  
  team_id: z.number().int().nullable().optional(),
  source: z.enum(['ocr', 'manual']).optional(),
});

// Schema para atualização de player
export const updatePlayerSchema = createPlayerSchema.partial();

// Schema para parâmetros de ID
export const playerIdSchema = z.object({
  id: z.coerce.number().int('ID deve ser um número inteiro'),
});

// Schema para query parameters com filtros
export const playerQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['name', 'position', 'age', 'ovr', 'created_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  name: z.string().optional(),
  position: z.string().optional(),
  team_id: z.coerce.number().int().optional(),
  min_ovr: z.coerce.number().int().optional(),
  max_ovr: z.coerce.number().int().optional(),
  isFreeAgent: z.coerce.boolean().optional(),
});

// Schema para OCR
export const ocrRequestSchema = z.object({
  imageUrl: z.string().url('URL da imagem deve ser válida'),
  imageData: z.string().optional(), // base64
});

// Schema para transferência de player
export const transferPlayerSchema = z.object({
  newTeam: z.number().int('Novo time deve ser um ID válido'),
});

// Schema para atualização em lote
export const batchUpdateSchema = z.object({
  players: z.array(z.object({
    id: z.number().int('ID deve ser um número inteiro'),
    updates: createPlayerSchema.partial(),
  })).min(1, 'Pelo menos um player deve ser fornecido'),
});

// Tipos inferidos dos schemas
export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;
export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;
export type PlayerIdInput = z.infer<typeof playerIdSchema>;
export type PlayerQueryInput = z.infer<typeof playerQuerySchema>;
export type OCRRequestInput = z.infer<typeof ocrRequestSchema>;
export type TransferPlayerInput = z.infer<typeof transferPlayerSchema>;
export type BatchUpdateInput = z.infer<typeof batchUpdateSchema>; 