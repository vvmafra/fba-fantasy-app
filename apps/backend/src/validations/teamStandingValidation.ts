import { z } from 'zod';

// Schema para criação de team standing
export const createTeamStandingSchema = z.object({
  season_id: z.number().positive('ID da temporada é obrigatório'),
  team_id: z.number().positive('ID do time é obrigatório'),
  final_position: z.number().min(0).max(30, 'Posição deve estar entre 0 e 30'),
  seed: z.number().min(0).max(15, 'Seed deve estar entre 0 e 15'),
  elimination_round: z.number().min(0).max(5, 'Rodada de eliminação deve estar entre 0 e 5')
});

// Schema para atualização de team standing
export const updateTeamStandingSchema = z.object({
  final_position: z.number().min(0).max(30, 'Posição deve estar entre 0 e 30').optional(),
  seed: z.number().min(0).max(15, 'Seed deve estar entre 0 e 15').optional(),
  elimination_round: z.number().min(0).max(5, 'Rodada de eliminação deve estar entre 0 e 5').optional()
});

// Schema para validação de múltiplos standings
export const validateStandingsSchema = z.object({
  standings: z.array(createTeamStandingSchema)
});

// Função para validar regras de playoffs
export const validatePlayoffRules = (standings: any[]) => {
  const errors: string[] = [];
  
  // Contar times em cada rodada
  const counts = {
    round1: standings.filter(s => s.elimination_round === 1).length,
    round2: standings.filter(s => s.elimination_round === 2).length,
    finalConf: standings.filter(s => s.elimination_round === 3).length,
    vice: standings.filter(s => s.elimination_round === 4).length,
    champion: standings.filter(s => s.elimination_round === 5).length
  };
  
  // Validar regras
  if (counts.champion > 1) {
    errors.push('Apenas 1 time pode ser campeão');
  }
  
  if (counts.vice > 1) {
    errors.push('Apenas 1 time pode ser vice-campeão');
  }
  
  if (counts.finalConf > 2) {
    errors.push('Apenas 2 times podem chegar à final de conferência');
  }
  
  if (counts.round2 > 4) {
    errors.push('Apenas 4 times podem chegar à 2ª rodada');
  }
  
  if (counts.round1 > 8) {
    errors.push('Apenas 8 times podem chegar à 1ª rodada');
  }
  
  return errors;
}; 