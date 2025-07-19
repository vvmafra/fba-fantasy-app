import { useQuery } from '@tanstack/react-query';
import { editionRankingService, EditionRankingTeam } from '@/services/editionRankingService';

// Hook para buscar ranking de edição geral
export const useEditionRanking = () => {
  return useQuery({
    queryKey: ['edition-ranking'],
    queryFn: () => editionRankingService.getEditionRanking(),
  });
};

// Hook para buscar ranking de edição por temporada
export const useEditionRankingBySeason = (seasonId: number) => {
  return useQuery({
    queryKey: ['edition-ranking', 'season', seasonId],
    queryFn: () => editionRankingService.getEditionRankingBySeason(seasonId),
    enabled: !!seasonId,
  });
};

// Hook para buscar ranking de um time específico
export const useTeamEditionRanking = (teamId: number) => {
  return useQuery({
    queryKey: ['edition-ranking', 'team', teamId],
    queryFn: () => editionRankingService.getTeamEditionRanking(teamId),
    enabled: !!teamId,
  });
}; 