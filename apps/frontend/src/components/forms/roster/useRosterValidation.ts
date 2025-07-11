import { useMemo } from 'react';
import { PlayerWithMinutes, ValidationErrors } from './types';

export function useRosterValidation(
  players: PlayerWithMinutes[],
  starters: PlayerWithMinutes[],
  bench: PlayerWithMinutes[],
  rotationStyle: 'automatic' | 'manual' = 'manual',
  gameStyle?: string,
  offenseStyle?: string,
  defenseStyle?: string
) {
  const validationErrors = useMemo((): ValidationErrors => {
    const errors: ValidationErrors = {};
    const activePlayers = players.filter(p => !p.isGLeague);
    const totalMinutes = activePlayers.reduce((sum, p) => sum + p.minutes, 0);
    const top5Players = starters.filter(p => !p.isGLeague).slice(0, 5);
    const highOVRPlayers = players.filter(p => !p.isGLeague && p.ovr >= 85);
    const benchPlayers = bench.filter(p => !p.isGLeague);

    // Regra 1: 240 minutos no total (apenas no modo manual)
    if (rotationStyle === 'manual' && totalMinutes !== 240) {
      errors.totalMinutes = `Total de minutos deve ser 240 (atual: ${totalMinutes})`;
    }

    // Regra 2: Top 5 jogadores com mínimo 25 minutos (exceto se 3+ jogadores 85+) - apenas modo manual
    if (rotationStyle === 'manual' && highOVRPlayers.length < 3) {
      const lowMinutesTop5 = top5Players.filter(p => p.minutes < 25);
      if (lowMinutesTop5.length > 0) {
        errors.top5Minutes = `Top 5 jogadores devem ter pelo menos 25 minutos: ${lowMinutesTop5.map(p => p.name).join(', ')}`;
      }
    }

    // Regra 3: Máximo 40 minutos por jogador - apenas modo manual
    if (rotationStyle === 'manual') {
      const overMaxMinutes = activePlayers.filter(p => p.minutes > 40);
      if (overMaxMinutes.length > 0) {
        errors.maxMinutes = `Jogadores não podem ter mais de 40 minutos: ${overMaxMinutes.map(p => p.name).join(', ')}`;
      }
    }

    // Regra 4: Reservas com mínimo 5 minutos - apenas modo manual
    if (rotationStyle === 'manual') {
      const lowMinutesBench = benchPlayers.filter(p => p.minutes > 0 && p.minutes < 6);
      if (lowMinutesBench.length > 0) {
        errors.benchMinutes = `Reservas devem ter mais que 5 minutos (ou 0): ${lowMinutesBench.map(p => p.name).join(', ')}`;
      }
    }

    // Regra 5: Mínimo 8 jogadores (aplica para ambos os modos)
    if (activePlayers.length < 8) {
      errors.minPlayers = `Time deve ter pelo menos 8 jogadores ativos (atual: ${activePlayers.length})`;
    }

    // Regras G-League
    const gleaguePlayers = players.filter(p => p.isGLeague);
    const playerCount = players.length;

    // Verificar quantidade de jogadores na G-League
    let maxGLeagueAllowed = 0;
    if (playerCount === 15) maxGLeagueAllowed = 2;
    else if (playerCount === 14) maxGLeagueAllowed = 1;
    else if (playerCount === 13) maxGLeagueAllowed = 0;

    if (gleaguePlayers.length > maxGLeagueAllowed) {
      errors.gleagueCount = `Times com ${playerCount} jogadores podem enviar no máximo ${maxGLeagueAllowed} para G-League`;
    }

    // Verificar elegibilidade para G-League
    const ineligibleGLeague = gleaguePlayers.filter(p => {
      const has2YearsOrLess = p.age <= 25; // Simplificado - assumindo que idade <= 25 = 2 anos ou menos
      const isTop5Draft = false; // Simplificado - seria necessário campo adicional
      return !has2YearsOrLess || isTop5Draft;
    });

    if (ineligibleGLeague.length > 0) {
      errors.gleagueEligibility = `Jogadores não elegíveis para G-League: ${ineligibleGLeague.map(p => p.name).join(', ')}`;
    }

    // Regras obrigatórias para seleção de estilos
    if (!gameStyle) {
      errors.gameStyle = 'Selecione um estilo de jogo';
    }
    if (!offenseStyle) {
      errors.offenseStyle = 'Selecione um estilo de ataque';
    }
    if (!defenseStyle) {
      errors.defenseStyle = 'Selecione um estilo de defesa';
    }

    return errors;
  }, [players, starters, bench, rotationStyle, gameStyle, offenseStyle, defenseStyle]);

  return validationErrors;
} 