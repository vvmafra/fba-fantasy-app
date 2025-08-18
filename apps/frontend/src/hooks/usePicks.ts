import { useQuery } from '@tanstack/react-query';
import { getTeamFuturePicks, TeamFuturePicks, getAllPicks } from '@/services/pickService';
import { useActiveSeason } from './useSeasons';

export function useTeamFuturePicks(teamId?: number) {
  return useQuery({
    queryKey: ['teamFuturePicks', teamId],
    queryFn: () => {
      if (!teamId) return Promise.resolve(null);
      return getTeamFuturePicks(teamId).then(res => res.data);
    },
    enabled: !!teamId,
  });
}

// Hook para buscar todas as picks (similar ao usePlayers)
export function usePicks(params?: { getAll?: boolean }) {
  const { data: activeSeason } = useActiveSeason();
  
  return useQuery({
    queryKey: ['picks', params, activeSeason?.data?.id],
    queryFn: () => getAllPicks().then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: !!activeSeason?.data?.id, // Só executa quando há temporada ativa
  });
} 