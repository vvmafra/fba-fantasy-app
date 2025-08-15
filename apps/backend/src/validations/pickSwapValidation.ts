import { z } from 'zod';

// Schema para criação de pick swap
export const createPickSwapSchema = z.object({
  season_id: z.number().int('Season ID deve ser um número inteiro'),
  swap_type: z.enum(['best', 'worst'], {
    errorMap: () => ({ message: 'Swap type deve ser best ou worst' })
  }),
  pick_a_id: z.number().int('Pick A ID deve ser um número inteiro'),
  pick_b_id: z.number().int('Pick B ID deve ser um número inteiro'),
  owned_by_team_id: z.number().int('Owned by team ID deve ser um número inteiro'),
});

// Schema para atualização de pick swap (se necessário no futuro)
export const updatePickSwapSchema = createPickSwapSchema.partial();

// Schema para validação de ID
export const pickSwapIdSchema = z.object({
  id: z.string().transform((val) => parseInt(val)).refine((val) => !isNaN(val), {
    message: 'ID deve ser um número válido'
  })
});

// Schema para validação de team ID
export const teamIdSchema = z.object({
  teamId: z.string().transform((val) => parseInt(val)).refine((val) => !isNaN(val), {
    message: 'Team ID deve ser um número válido'
  })
}); 