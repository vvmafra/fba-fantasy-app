import { useMemo } from 'react';
import { PlayerWithMinutes, ValidationErrors } from './types';

export function useRosterPlayoffsValidation(
  players: PlayerWithMinutes[],
  starters: PlayerWithMinutes[],
  bench: PlayerWithMinutes[],
  rotationStyle: 'automatic' | 'manual',
  gameStyle: string,
  offenseStyle: string,
  defenseStyle: string
): ValidationErrors {
  return useMemo(() => {
    const errors: ValidationErrors = {};

    // Validar campos obrigatórios
    if (!gameStyle.trim()) {
      errors.gameStyle = 'Estilo de jogo é obrigatório';
    }

    if (!offenseStyle.trim()) {
      errors.offenseStyle = 'Estilo de ataque é obrigatório';
    }

    if (!defenseStyle.trim()) {
      errors.defenseStyle = 'Estilo de defesa é obrigatório';
    }

    // Validações específicas para modo manual
    if (rotationStyle === 'manual') {
      const activePlayers = players.filter(p => !p.isGLeague);
      const totalMinutes = activePlayers.reduce((sum, p) => sum + p.minutes, 0);

      // Validar total de minutos (240 para playoffs)
      if (totalMinutes !== 240) {
        errors.totalMinutes = `Total de minutos deve ser 240 (atual: ${totalMinutes})`;
      }

      // Validar número mínimo de jogadores ativos
      const playersWithMinutes = activePlayers.filter(p => p.minutes > 0);
      if (playersWithMinutes.length < 8) {
        errors.minPlayers = 'Mínimo de 8 jogadores deve ter minutos distribuídos';
      }

      // Validar minutos por jogador
      activePlayers.forEach(player => {
        if (player.minutes > 45) {
          errors.maxMinutes = `Jogador ${player.name} não pode ter mais de 45 minutos`;
        }
        if (player.minutes > 0 && player.minutes < 5) {
          errors.benchMinutes = `Jogador ${player.name} deve ter pelo menos 5 minutos ou 0`;
        }
      });

      // Validar top 5 OVR (sem G-League)
      const top5Players = players
        .filter(p => !p.isGLeague)
        .sort((a, b) => b.ovr - a.ovr)
        .slice(0, 5);

      const highOVRPlayers = players.filter(p => p.ovr >= 85 && !p.isGLeague);
      
      top5Players.forEach(player => {
        if (player.minutes < 25 && highOVRPlayers.length < 3) {
          errors.top5Minutes = `Top 5 OVR ${player.name} deve ter pelo menos 25 minutos (exceto se 3+ jogadores 85+)`;
        }
      });
    }

    return errors;
  }, [players, starters, bench, rotationStyle, gameStyle, offenseStyle, defenseStyle]);
} 
