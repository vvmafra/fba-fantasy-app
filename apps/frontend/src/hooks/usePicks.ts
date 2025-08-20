import { useQuery } from '@tanstack/react-query';
import { getTeamFuturePicks, TeamFuturePicks, getAllPicks } from '@/services/pickService';
import { useActiveSeason } from './useSeasons';

export function useTeamFuturePicks(teamId?: number) {
  return useQuery({
    queryKey: ['teamFuturePicks', teamId],
    queryFn: async () => {
      if (!teamId) return null;
      try {
        console.log('Buscando picks futuras para time:', teamId);
        const response = await getTeamFuturePicks(teamId);
        console.log('Resposta da API:', response);
        return response.data;
      } catch (error) {
        console.error('Erro ao buscar picks futuras:', error);
        throw error;
      }
    },
    enabled: !!teamId,
    retry: 1,
    retryDelay: 1000,
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